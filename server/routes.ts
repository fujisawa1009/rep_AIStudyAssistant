import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import {
  topics,
  quizzes,
  quizResults,
  chatHistory,
  insertTopicSchema,
  insertQuizSchema,
  insertQuizResultSchema,
  insertChatHistorySchema,
} from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  generateCurriculum,
  generateQuiz,
  getTutorResponse,
  analyzeWeakness,
} from "./openai";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Topics
  app.post("/api/topics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const result = insertTopicSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const curriculum = await generateCurriculum(
        result.data.name,
        result.data.description || ""
      );

      const [topic] = await db
        .insert(topics)
        .values({
          name: result.data.name,
          description: result.data.description,
          userId: (req.user as any).id,
          curriculum,
        })
        .returning();

      res.json(topic);
    } catch (error: any) {
      console.error("Error creating topic:", error);
      res.status(500).send(error.message);
    }
  });

  app.get("/api/topics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const userTopics = await db
        .select()
        .from(topics)
        .where(sql`${topics.userId} = ${(req.user as any).id}`);
      res.json(userTopics);
    } catch (error: any) {
      console.error("Error fetching topics:", error);
      res.status(500).send(error.message);
    }
  });

  // Quizzes
  app.post("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const result = insertQuizSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const topicResult = await db
        .select()
        .from(topics)
        .where(sql`${topics.id} = ${result.data.topicId}`);

      const topic = topicResult[0];
      if (!topic) {
        return res.status(404).send("Topic not found");
      }

      const quizQuestions = await generateQuiz(topic.name, "medium");

      const [quiz] = await db
        .insert(quizzes)
        .values({
          ...result.data,
          userId: (req.user as any).id,
          questions: quizQuestions,
        })
        .returning();

      res.json(quiz);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      res.status(500).send(error.message);
    }
  });

  // Quiz Results
  app.post("/api/quiz-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const result = insertQuizResultSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const [quizResult] = await db
        .insert(quizResults)
        .values({
          ...result.data,
          userId: (req.user as any).id,
        })
        .returning();

      res.json(quizResult);
    } catch (error: any) {
      console.error("Error submitting quiz result:", error);
      res.status(500).send(error.message);
    }
  });

  // Analysis
  app.get("/api/analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const results = await db
        .select()
        .from(quizResults)
        .where(sql`${quizResults.userId} = ${(req.user as any).id}`);

      const analysis = await analyzeWeakness(results);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error generating analysis:", error);
      res.status(500).send(error.message);
    }
  });

  // Chat
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const result = insertChatHistorySchema.safeParse({
        message: req.body.message,
        topicId: req.body.topicId,
      });
      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const topicResult = await db
        .select()
        .from(topics)
        .where(sql`${topics.id} = ${result.data.topicId}`);

      const topic = topicResult[0];
      if (!topic) {
        return res.status(404).send("Topic not found");
      }

      const previousMessages = await db
        .select()
        .from(chatHistory)
        .where(
          sql`${chatHistory.userId} = ${(req.user as any).id} AND ${chatHistory.topicId} = ${result.data.topicId}`
        )
        .orderBy(chatHistory.createdAt);

      const chatContext = previousMessages.map((msg) => ({
        role: msg.isAi ? "assistant" : "user",
        content: msg.message,
      }));

      // Store user's message first
      const [userMessage] = await db
        .insert(chatHistory)
        .values({
          userId: (req.user as any).id,
          topicId: result.data.topicId,
          message: result.data.message,
          isAi: false,
        })
        .returning();

      // Get AI response
      const aiResponse = await getTutorResponse(
        result.data.message,
        topic.name,
        chatContext
      );

      // Store AI's response
      const [aiMessage] = await db
        .insert(chatHistory)
        .values({
          userId: (req.user as any).id,
          topicId: result.data.topicId,
          message: aiResponse,
          isAi: true,
        })
        .returning();

      res.json(aiMessage);
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}