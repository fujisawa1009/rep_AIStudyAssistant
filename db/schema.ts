// データベースのスキーマ定義ファイル
// PostgreSQLのテーブル構造とそれらの関係を定義する
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// ユーザーテーブルの定義
// ユーザーの基本情報と認証情報を格納
export const users = pgTable("users", {
  id: serial("id").primaryKey(),                    // ユーザーID（自動採番）
  username: text("username").unique().notNull(),     // ユーザー名（一意）
  password: text("password").notNull(),             // パスワード（ハッシュ化して保存）
  learningGoals: text("learning_goals"),            // 学習目標（任意）
  createdAt: timestamp("created_at").defaultNow(),  // アカウント作成日時
});

// トピックテーブルの定義
// 学習トピックの情報を格納
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),                    // トピックID（自動採番）
  userId: integer("user_id").references(() => users.id),  // 作成者のユーザーID
  name: text("name").notNull(),                     // トピック名
  description: text("description"),                 // トピックの説明
  curriculum: jsonb("curriculum"),                  // カリキュラム内容（JSON形式）
  createdAt: timestamp("created_at").defaultNow(),  // トピック作成日時
});

// クイズテーブルの定義
// トピックごとのクイズ情報を格納
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),                    // クイズID（自動採番）
  userId: integer("user_id").references(() => users.id).notNull(),    // 作成者のユーザーID
  topicId: integer("topic_id").references(() => topics.id).notNull(), // 関連するトピックID
  questions: jsonb("questions").notNull(),          // クイズの問題（JSON形式）
  createdAt: timestamp("created_at").defaultNow(),  // クイズ作成日時
});

// クイズ結果テーブルの定義
// ユーザーのクイズ回答結果を格納
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),                    // 結果ID（自動採番）
  userId: integer("user_id").references(() => users.id),    // 回答者のユーザーID
  quizId: integer("quiz_id").references(() => quizzes.id),  // クイズのID
  score: integer("score").notNull(),                // 得点
  answers: jsonb("answers").notNull(),              // 回答内容（JSON形式）
  createdAt: timestamp("created_at").defaultNow(),  // 回答日時
});

// チャット履歴テーブルの定義
// AI チューターとのチャットログを格納
export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),                    // チャットID（自動採番）
  userId: integer("user_id").references(() => users.id),    // ユーザーID
  topicId: integer("topic_id").references(() => topics.id), // トピックID
  message: text("message").notNull(),               // メッセージ内容
  isAi: boolean("is_ai").notNull(),                // AIの発言かどうか
  createdAt: timestamp("created_at").defaultNow(),  // メッセージ作成日時
});

// リレーションの定義
// トピックとの関連付け
export const topicsRelations = relations(topics, ({ one, many }) => ({
  user: one(users, {                               // トピックの作成者
    fields: [topics.userId],
    references: [users.id],
  }),
  quizzes: many(quizzes),                         // トピックに関連するクイズ
  chatHistory: many(chatHistory),                 // トピックに関連するチャット履歴
}));

// クイズとの関連付け
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, {                               // クイズの作成者
    fields: [quizzes.userId],
    references: [users.id],
  }),
  topic: one(topics, {                             // クイズが属するトピック
    fields: [quizzes.topicId],
    references: [topics.id],
  }),
  results: many(quizResults),                      // クイズの回答結果
}));

// クイズ結果との関連付け
export const quizResultsRelations = relations(quizResults, ({ one }) => ({
  user: one(users, {                               // 回答者
    fields: [quizResults.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {                             // 回答したクイズ
    fields: [quizResults.quizId],
    references: [quizzes.id],
  }),
}));

// チャット履歴との関連付け
export const chatHistoryRelations = relations(chatHistory, ({ one }) => ({
  user: one(users, {                               // チャットの参加者
    fields: [chatHistory.userId],
    references: [users.id],
  }),
  topic: one(topics, {                             // チャットが属するトピック
    fields: [chatHistory.topicId],
    references: [topics.id],
  }),
}));

// バリデーションスキーマの作成
// ユーザー関連のスキーマ
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// トピック関連のスキーマ
export const insertTopicSchema = createInsertSchema(topics);
export const selectTopicSchema = createSelectSchema(topics);

// クイズ関連のスキーマ（カスタム定義）
export const insertQuizSchema = z.object({
  topicId: z.number(),
  userId: z.number(),
});
export const selectQuizSchema = createSelectSchema(quizzes);

// クイズ結果関連のスキーマ
export const insertQuizResultSchema = createInsertSchema(quizResults);
export const selectQuizResultSchema = createSelectSchema(quizResults);

// チャット履歴関連のスキーマ
export const insertChatHistorySchema = createInsertSchema(chatHistory);
export const selectChatHistorySchema = createSelectSchema(chatHistory);

// 型定義のエクスポート
// データベースの各テーブルの型をTypeScriptの型として定義
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = typeof quizResults.$inferInsert;

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;