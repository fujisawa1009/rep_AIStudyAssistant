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
import { eq, and } from "drizzle-orm";
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
        return res.status(400).send("Invalid input");
      }

      const curriculum = await generateCurriculum(
        result.data.name,
        req.user.learningGoals || ""
      );

      const [topic] = await db
        .insert(topics)
        .values({
          ...result.data,
          userId: req.user.id,
          curriculum,
        })
        .returning();

      res.json(topic);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/topics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const userTopics = await db
        .select()
        .from(topics)
        .where(eq(topics.userId, req.user.id));
      res.json(userTopics);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // Quizzes
  app.post("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const result = insertQuizSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input");
      }

      const topic = await db
        .select()
        .from(topics)
        .where(eq(topics.id, result.data.topicId))
        .limit(1);

      const quizQuestions = await generateQuiz(topic[0].name, "medium");

      const [quiz] = await db
        .insert(quizzes)
        .values({
          ...result.data,
          userId: req.user.id,
          questions: quizQuestions,
        })
        .returning();

      res.json(quiz);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.post("/api/quiz-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const result = insertQuizResultSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input");
      }

      const [quizResult] = await db
        .insert(quizResults)
        .values({
          ...result.data,
          userId: req.user.id,
        })
        .returning();

      res.json(quizResult);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/analysis", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const results = await db
        .select()
        .from(quizResults)
        .where(eq(quizResults.userId, req.user.id));

      const analysis = await analyzeWeakness(results);
      res.json(analysis);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // Chat
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const result = insertChatHistorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input");
      }

      const topic = await db
        .select()
        .from(topics)
        .where(eq(topics.id, result.data.topicId))
        .limit(1);

      const previousMessages = await db
        .select()
        .from(chatHistory)
        .where(
          and(
            eq(chatHistory.userId, req.user.id),
            eq(chatHistory.topicId, result.data.topicId)
          )
        )
        .orderBy(chatHistory.createdAt);

      const chatContext = previousMessages.map((msg) => ({
        role: msg.isAi ? "assistant" : "user",
        content: msg.message,
      }));

      const aiResponse = await getTutorResponse(
        result.data.message,
        topic[0].name,
        chatContext
      );

      await db.insert(chatHistory).values({
        userId: req.user.id,
        topicId: result.data.topicId,
        message: result.data.message,
        isAi: false,
      });

      const [aiMessage] = await db
        .insert(chatHistory)
        .values({
          userId: req.user.id,
          topicId: result.data.topicId,
          message: aiResponse,
          isAi: true,
        })
        .returning();

      res.json(aiMessage);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
