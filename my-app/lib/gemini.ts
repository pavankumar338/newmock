// Gemini AI Service for Mock Interview
// This file handles the integration with Google's Gemini API using the official SDK

interface InterviewContext {
  role: string;
  level: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface QuestionFeedbackContext {
  role: string;
  level: string;
  question: string;
  userAnswer: string;
  questionNumber: number;
}

export class GeminiService {
  private apiKey: string;
  private ai: any; // Will be GoogleGenAI instance

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Initialize the Google GenAI SDK
    this.initializeAI();
  }

  private async initializeAI() {
    try {
      // Dynamic import to avoid SSR issues
      const { GoogleGenAI } = await import('@google/genai');
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } catch (error) {
      console.error('Failed to initialize Google GenAI:', error);
    }
  }

  async generateInterviewResponse(context: InterviewContext): Promise<string> {
    try {
      const prompt = this.buildInterviewPrompt(context);
      
      console.log('Using Google GenAI SDK...');
      console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
      
      // Ensure AI is initialized
      if (!this.ai) {
        await this.initializeAI();
      }
      
      if (!this.ai) {
        throw new Error('Failed to initialize Google GenAI SDK');
      }

      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash", // Using the newer model
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      console.log('Response received from Google GenAI SDK');
      
      if (response && response.text) {
        return response.text;
      } else {
        throw new Error('Invalid response format from Google GenAI SDK');
      }
    } catch (error) {
      console.error('Error calling Google GenAI SDK:', error);
      
      // Handle rate limiting
      if (error instanceof Error && error.message && error.message.includes('429')) {
        console.log('Rate limit exceeded, using fallback responses');
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      throw error;
    }
  }

  private buildInterviewPrompt(context: InterviewContext): string {
    const roleLabels: Record<string, string> = {
      nurse: 'Registered Nurse',
      doctor: 'Medical Doctor',
      pharmacist: 'Pharmacist',
      therapist: 'Physical Therapist',
      technician: 'Medical Technician'
    };

    const levelLabels: Record<string, string> = {
      entry: 'entry-level',
      mid: 'mid-level',
      senior: 'senior-level'
    };

    const role = roleLabels[context.role] || context.role;
    const level = levelLabels[context.level] || context.level;

    let prompt = `You are a friendly, professional healthcare interviewer conducting a realistic mock interview for a ${level} ${role} position. Your goal is to simulate a real human interviewer, not just a chatbot.

- Greet the user and introduce yourself at the start.
- Ask open-ended, relevant interview questions appropriate for the position and experience level.
- After each user answer, respond naturally: acknowledge, encourage, or ask for clarification or follow-up details as a human would.
- Maintain a conversational, context-aware flow. Reference previous answers when appropriate.
- Use a warm, professional, and supportive tone.
- Do not just ask questions—react to the user's answers as a real interviewer would.
- Occasionally provide encouragement or brief feedback, but do not summarize the whole interview until the end.
- Keep responses concise (2-4 sentences) and avoid sounding robotic.

Current interview context:
- Position: ${role}
- Experience Level: ${level}
- Number of exchanges: ${context.messages.length}

Conversation so far:
`;

    // Add conversation history
            context.messages.forEach((message) => {
          prompt += `${message.role === 'user' ? 'Candidate' : 'Interviewer'}: ${message.content}\n`;
        });

    prompt += `\nContinue the interview as a real human interviewer. If the candidate just answered, respond naturally and ask a relevant follow-up or next question. If the candidate asked a question, answer it professionally. Only end the interview if the candidate says they are finished or asks to end.\n\nInterviewer:`;

    return prompt;
  }

  async generateQuestionFeedback(context: QuestionFeedbackContext): Promise<{
    question: string;
    userAnswer: string;
    expectedAnswer: string;
    rating: number;
    feedback: string;
    category: string;
  }> {
    try {
      const roleLabels: Record<string, string> = {
        nurse: 'Registered Nurse',
        doctor: 'Medical Doctor',
        pharmacist: 'Pharmacist',
        therapist: 'Physical Therapist',
        technician: 'Medical Technician'
      };

      const role = roleLabels[context.role] || context.role;

      const prompt = `You are an expert healthcare recruiter evaluating a specific interview question response for a ${context.level} ${role} position.

Question ${context.questionNumber}: ${context.question}

Candidate's Answer: ${context.userAnswer}

Please provide detailed feedback in the following JSON format:
{
  "question": "The interview question",
  "userAnswer": "The candidate's response",
  "expectedAnswer": "What an ideal answer should include",
  "rating": 4,
  "feedback": "Specific feedback on the response",
  "category": "Communication|Technical Knowledge|Problem Solving|Professionalism|Experience"
}

Rating scale: 1-5 (1=Poor, 2=Below Average, 3=Average, 4=Good, 5=Excellent)

Focus on:
- How well the answer addresses the question
- Specific examples and details provided
- Professional communication skills
- Technical knowledge demonstrated
- Areas for improvement

Provide the response as valid JSON only:`;

      // Ensure AI is initialized
      if (!this.ai) {
        await this.initializeAI();
      }
      
      if (!this.ai) {
        throw new Error('Failed to initialize Google GenAI SDK');
      }

      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      if (response && response.text) {
        try {
          const feedbackData = JSON.parse(response.text);
          return {
            question: feedbackData.question || context.question,
            userAnswer: feedbackData.userAnswer || context.userAnswer,
            expectedAnswer: feedbackData.expectedAnswer || "A comprehensive answer demonstrating knowledge and experience",
            rating: feedbackData.rating || 3,
            feedback: feedbackData.feedback || "Good response with room for improvement",
            category: feedbackData.category || "Communication"
          };
        } catch (parseError) {
          console.error('Error parsing feedback JSON:', parseError);
          return {
            question: context.question,
            userAnswer: context.userAnswer,
            expectedAnswer: "A comprehensive answer demonstrating knowledge and experience",
            rating: 3,
            feedback: "Good response with room for improvement",
            category: "Communication"
          };
        }
      } else {
        throw new Error('Invalid response format from Google GenAI SDK');
      }
    } catch (error) {
      console.error('Error generating question feedback:', error);
      
      // Handle rate limiting
      if (error instanceof Error && error.message && error.message.includes('429')) {
        console.log('Rate limit exceeded for question feedback generation');
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      throw error;
    }
  }

  async generateInterviewFeedback(context: InterviewContext): Promise<string> {
    try {
      const prompt = `You are an expert healthcare recruiter providing feedback on a mock interview for a ${context.role} position.

Based on the following interview conversation, provide constructive feedback including:
1. Strengths demonstrated
2. Areas for improvement
3. Overall assessment
4. Specific recommendations

Keep the feedback professional, constructive, and actionable.

Interview conversation:
${context.messages.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

Please provide your feedback:`;

      // Ensure AI is initialized
      if (!this.ai) {
        await this.initializeAI();
      }
      
      if (!this.ai) {
        throw new Error('Failed to initialize Google GenAI SDK');
      }

      const response = await this.ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      if (response && response.text) {
        return response.text;
      } else {
        throw new Error('Invalid response format from Google GenAI SDK');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      
      // Handle rate limiting
      if (error instanceof Error && error.message && error.message.includes('429')) {
        console.log('Rate limit exceeded for feedback generation');
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      throw error;
    }
  }
}

// Test function to verify API key
export const testGeminiAPI = async (apiKey: string): Promise<boolean> => {
  try {
    // Dynamic import to avoid SSR issues
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello, this is a test message.",
      config: {
        maxOutputTokens: 50,
      }
    });
    
    return !!(response && response.text);
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
};

// Fallback responses when Gemini API is not available
export const getFallbackResponse = (messageCount: number, role: string): string => {
  const roleLabels: Record<string, string> = {
    nurse: 'Registered Nurse',
    doctor: 'Medical Doctor',
    pharmacist: 'Pharmacist',
    therapist: 'Physical Therapist',
    technician: 'Medical Technician'
  };

  const roleLabel = roleLabels[role] || role;
  
  const questions = [
    `That's a great start! Can you tell me about a challenging situation you've faced in your previous healthcare experience and how you handled it?`,
    `Excellent. How do you stay updated with the latest developments and best practices in your field?`,
    `Good. Can you describe a time when you had to work with a difficult colleague or patient? How did you manage the situation?`,
    `Thank you for sharing that. What are your long-term career goals in healthcare?`,
    `That's very insightful. How do you handle stress and maintain work-life balance in a demanding healthcare environment?`,
    `Great answer. Can you walk me through your approach to patient care and how you ensure quality outcomes?`,
    `Excellent. What do you think are the most important qualities for a successful ${roleLabel}?`,
    `Thank you for your responses. Do you have any questions for me about the position or the organization?`
  ];

  const index = Math.min(messageCount - 1, questions.length - 1);
  return questions[index] || questions[questions.length - 1];
}; 