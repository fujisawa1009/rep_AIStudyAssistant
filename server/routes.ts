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

      let curriculum;
      try {
        curriculum = await generateCurriculum(
          result.data.name,
          result.data.description || ""
        );
      } catch (error: any) {
        console.error("Error generating curriculum:", error);
        return res.status(500).send("カリキュラムの生成に失敗しました: " + error.message);
      }

      // トピックの作成（1回のみ実行）
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

  // Delete topic
  app.delete("/api/topics/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Not authorized");

    try {
      const topicId = parseInt(req.params.id);
      if (isNaN(topicId)) {
        return res.status(400).send("Invalid topic ID");
      }

      // Verify topic ownership
      const [topic] = await db
        .select()
        .from(topics)
        .where(
          and(
            eq(topics.id, topicId),
            eq(topics.userId, (req.user as any).id)
          )
        )
        .limit(1);

      if (!topic) {
        return res.status(404).send("Topic not found or unauthorized");
      }

      // Delete related records first
      await db
        .delete(chatHistory)
        .where(eq(chatHistory.topicId, topicId));

      await db
        .delete(quizResults)
        .where(eq(quizResults.quizId, sql`(SELECT id FROM ${quizzes} WHERE topic_id = ${topicId})`));

      await db
        .delete(quizzes)
        .where(eq(quizzes.topicId, topicId));

      // Delete the topic
      await db
        .delete(topics)
        .where(eq(topics.id, topicId));

      res.json({ message: "Topic deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting topic:", error);
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
        userId: (req.user as any).id,
        isAi: false,
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