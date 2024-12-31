import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCurriculum(topic: string, goal: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `あなたは専門的なカリキュラムデザイナーです。以下の形式の有効なJSONオブジェクトのみを返してください：

{
  "sections": [
    {
      "title": "セクションのタイトル",
      "description": "セクションの詳細な説明（学習内容と重要性を含む）",
      "objectives": ["具体的な学習目標1", "具体的な学習目標2"],
      "resources": ["推奨教材や参考資料1", "推奨教材や参考資料2"]
    }
  ],
  "estimatedDuration": "カリキュラム全体の推定所要時間（例：約20時間）",
  "prerequisites": ["必要な前提知識や準備1", "必要な前提知識や準備2"]
}

以下の点に注意してカリキュラムを作成してください：
1. セクションは論理的な順序で配置し、基礎から応用へと段階的に進むようにする
2. 各セクションの説明は具体的で、なぜそれを学ぶ必要があるかを明確にする
3. 学習目標は測定可能で具体的な形で記述する
4. 推奨教材には実践的な演習や問題集も含める
5. 学習時間は現実的な見積もりを提供する`
        },
        {
          role: "user",
          content: `トピック「${topic}」のカリキュラムを作成してください。学習目標: ${goal || "基礎から応用まで体系的に学ぶ"}`
        }
      ]
    });

    if (!response.choices[0].message.content) {
      throw new Error("カリキュラムの生成に失敗しました");
    }

    try {
      const curriculum = JSON.parse(response.choices[0].message.content);
      console.log("Generated curriculum:", curriculum);
      return curriculum;
    } catch (parseError) {
      console.error("Failed to parse curriculum:", parseError);
      throw new Error("カリキュラムのJSONパースに失敗しました");
    }
  } catch (error: any) {
    console.error("Curriculum generation error:", error);
    throw new Error("カリキュラムの生成に失敗しました: " + error.message);
  }
}

export async function getTutorResponse(
  message: string,
  context: string,
  chatHistory: Array<{ role: string; content: string }>
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `あなたは${context}を教えるチューターです。以下のガイドラインに従って応答してください：
1. 明確で簡潔な説明を心がけ、専門用語を使う場合は適切な解説を加える
2. 学習者の理解度に応じて説明の詳しさを調整する
3. 具体例や類似例を用いて概念の理解を促進する
4. 質問の意図を理解し、的確な回答を提供する
5. 必要に応じて、カリキュラムの関連する部分を参照する`
        },
        ...chatHistory.map(msg => ({
          role: msg.role as "assistant" | "user",
          content: msg.content
        })),
        {
          role: "user",
          content: message
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("チューターの応答の生成に失敗しました");
    }

    return content;
  } catch (error: any) {
    console.error("Tutor response error:", error);
    throw new Error("チューターの応答の生成に失敗しました: " + error.message);
  }
}

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

export async function generateQuiz(topic: string, difficulty: string): Promise<Question[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `以下の形式で5つの選択式問題を作成してください。回答は0から始まるインデックスで指定します：

{
  "questions": [
    {
      "question": "問題文をここに記述",
      "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "correctAnswer": 0
    }
  ]
}

クイズ作成時の注意点：
1. 問題文は明確で理解しやすい表現を使用する
2. 選択肢は明確な違いがあり、紛らわしくないものにする
3. 正解は必ず選択肢の中に含める
4. 難易度に応じた適切な問題を作成する
5. 必ず5問作成する`
        },
        {
          role: "user",
          content: `トピック「${topic}」の${difficulty}難易度のクイズを5問作成してください。`
        }
      ]
    });

    if (!response.choices[0].message.content) {
      throw new Error("クイズの生成に失敗しました");
    }

    try {
      const quiz = JSON.parse(response.choices[0].message.content);
      console.log("Generated quiz:", quiz);

      // バリデーション：questions配列が存在し、5つの問題があることを確認
      if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length !== 5) {
        throw new Error("クイズの形式が不正です");
      }

      // 各問題の形式を確認
      quiz.questions.forEach((q: Question, index: number) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
          throw new Error(`問題${index + 1}の形式が不正です`);
        }
      });

      return quiz.questions;
    } catch (parseError) {
      console.error("Failed to parse quiz:", parseError);
      throw new Error("クイズのJSONパースに失敗しました");
    }
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    throw new Error("クイズの生成に失敗しました: " + error.message);
  }
}

export async function analyzeWeakness(quizResults: any[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `あなたは学習分析の専門家です。以下の形式の有効なJSONオブジェクトのみで分析結果を返してください：

{
  "weakAreas": {
    "分野名": "この分野が改善が必要な理由の詳細な説明"
  },
  "recommendations": ["具体的な改善提案1", "具体的な改善提案2"]
}`
        },
        {
          role: "user",
          content: `以下のクイズ結果を分析し、改善提案を提供してください: ${JSON.stringify(quizResults)}`
        }
      ]
    });

    if (!response.choices[0].message.content) {
      throw new Error("分析の生成に失敗しました");
    }

    try {
      const analysis = JSON.parse(response.choices[0].message.content);
      console.log("Generated analysis:", analysis);
      return analysis;
    } catch (parseError) {
      console.error("Failed to parse analysis:", parseError);
      throw new Error("分析結果のJSONパースに失敗しました");
    }
  } catch (error: any) {
    console.error("Weakness analysis error:", error);
    throw new Error("弱点分析の生成に失敗しました: " + error.message);
  }
}