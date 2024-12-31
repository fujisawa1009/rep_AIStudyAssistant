import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCurriculum(topic: string, goal: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert curriculum designer. Create a structured learning path and return it in JSON format with the following structure:
{
  "sections": [
    {
      "title": "section title",
      "description": "section description",
      "objectives": ["learning objective 1", "learning objective 2"],
      "resources": ["recommended resource 1", "recommended resource 2"]
    }
  ],
  "estimatedDuration": "estimated time to complete the curriculum",
  "prerequisites": ["prerequisite 1", "prerequisite 2"]
}`
        },
        {
          role: "user",
          content: `Create a curriculum for learning ${topic}. The student's goal is: ${goal}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error("Failed to generate curriculum: " + error.message);
  }
}

export async function generateQuiz(topic: string, difficulty: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Create a multiple choice quiz with 5 questions and return it in JSON format with the following structure:
{
  "questions": [
    {
      "question": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correctAnswer": 0,
      "explanation": "explanation of the correct answer"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Generate a ${difficulty} difficulty quiz about ${topic}.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error("Failed to generate quiz: " + error.message);
  }
}

export async function getTutorResponse(
  message: string,
  context: string,
  chatHistory: Array<{ role: string; content: string }>
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful tutor teaching about ${context}. Provide clear, concise explanations.`
        },
        ...chatHistory,
        {
          role: "user",
          content: message
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error("Failed to get tutor response: " + error.message);
  }
}

export async function analyzeWeakness(quizResults: any[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze quiz results to identify areas for improvement and return the analysis in JSON format with the following structure:
{
  "weakAreas": {
    "areaName": "detailed explanation of why this area needs improvement",
  },
  "recommendations": ["specific recommendation 1", "specific recommendation 2"]
}`
        },
        {
          role: "user",
          content: `Analyze these quiz results and provide improvement suggestions: ${JSON.stringify(quizResults)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error("Failed to analyze weakness: " + error.message);
  }
}