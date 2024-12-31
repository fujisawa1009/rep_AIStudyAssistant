import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCurriculum(topic: string, goal: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a JSON-based expert curriculum designer. Create a structured learning path and respond with a valid JSON object only. The response must follow this exact structure:

{
  "sections": [
    {
      "title": "セクションのタイトル",
      "description": "セクションの詳細な説明",
      "objectives": ["学習目標1", "学習目標2"],
      "resources": ["推奨教材1", "推奨教材2"]
    }
  ],
  "estimatedDuration": "カリキュラム全体の推定所要時間",
  "prerequisites": ["前提知識1", "前提知識2"]
}`
        },
        {
          role: "user",
          content: `トピック「${topic}」のカリキュラムをJSON形式で作成してください。学習者の目標: ${goal || "基礎から応用まで体系的に学ぶ"}`
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("カリキュラムの生成に失敗しました");
    }

    const curriculum = JSON.parse(response.choices[0].message.content);
    console.log("Generated curriculum:", curriculum);
    return curriculum;
  } catch (error: any) {
    console.error("Curriculum generation error:", error);
    throw new Error("カリキュラムの生成に失敗しました: " + error.message);
  }
}

export async function generateQuiz(topic: string, difficulty: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a JSON-based quiz generator. Create 5 multiple choice questions and respond with a valid JSON object only. The response must follow this exact structure:

{
  "questions": [
    {
      "question": "問題文",
      "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "correctAnswer": 0,
      "explanation": "正解の説明"
    }
  ]
}`
        },
        {
          role: "user",
          content: `トピック「${topic}」の${difficulty}難易度のクイズをJSON形式で生成してください。`
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("クイズの生成に失敗しました");
    }

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    throw new Error("クイズの生成に失敗しました: " + error.message);
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
          content: `あなたは${context}を教えるチューターです。明確で簡潔な説明を心がけ、学習者の理解を促進してください。`
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

export async function analyzeWeakness(quizResults: any[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a JSON-based learning analyzer. Analyze quiz results and respond with a valid JSON object only. The response must follow this exact structure:

{
  "weakAreas": {
    "分野名": "この分野が改善が必要な理由の詳細な説明"
  },
  "recommendations": ["具体的な改善提案1", "具体的な改善提案2"]
}`
        },
        {
          role: "user",
          content: `以下のクイズ結果を分析し、JSONフォーマットで改善提案を提供してください: ${JSON.stringify(quizResults)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("分析の生成に失敗しました");
    }

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Weakness analysis error:", error);
    throw new Error("弱点分析の生成に失敗しました: " + error.message);
  }
}