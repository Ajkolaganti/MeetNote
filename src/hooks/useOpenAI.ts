import { useCallback } from 'react';
import OpenAI from 'openai';

export function useOpenAI() {
  const getOpenAIClient = useCallback(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file');
    }

    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });
  }, []);

  const generateAnalysis = useCallback(async (transcript: string): Promise<string> => {
    const openai = getOpenAIClient();
    
    const prompt = `You are an AI meeting assistant. Analyze the following meeting transcript and provide a comprehensive analysis. 

IMPORTANT GUIDELINES:
1. Assume the user has NO technical background - explain everything in simple terms
2. If there are technical details (code, SQL, APIs, etc.), provide the actual code/queries AND explain what they do in plain English
3. Use analogies and real-world comparisons to explain complex concepts
4. Structure your response with clear headings and sections
5. Include action items and next steps
6. If technical implementation is discussed, provide working code examples
7. Use monospace formatting for code blocks and technical terms

Meeting Transcript:
${transcript}

Please provide:
1. **Executive Summary** (in simple terms)
2. **Key Discussion Points**
3. **Technical Details** (with code examples if applicable)
4. **Simplified Explanations** (for non-technical understanding)
5. **Action Items**
6. **Next Steps**

Format your response in markdown for better readability. Use \`code blocks\` for technical terms and:

\`\`\`
Multi-line code blocks
for longer code examples
\`\`\``;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using faster model for real-time response
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that specializes in analyzing meeting transcripts and explaining technical concepts to non-technical users. Always format code and technical terms properly."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent responses
        stream: false
      });

      return completion.choices[0]?.message?.content || 'No analysis generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate analysis. Please check your OpenAI API key and try again.');
    }
  }, [getOpenAIClient]);

  const sendChatMessage = useCallback(async (
    message: string, 
    transcript: string, 
    analysis: string
  ): Promise<string> => {
    const openai = getOpenAIClient();
    
    const contextPrompt = `You are an AI assistant helping with questions about a meeting. Here's the context:

MEETING TRANSCRIPT:
${transcript}

PREVIOUS ANALYSIS:
${analysis}

USER QUESTION: ${message}

Please provide a helpful answer that:
1. References the specific meeting content
2. Explains technical concepts in simple terms
3. Provides code examples if relevant (use proper markdown formatting)
4. Uses analogies for complex topics
5. Is conversational and friendly
6. Uses monospace formatting for code: \`inline code\` and \`\`\`code blocks\`\`\`

Keep your response focused and concise while being thorough.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using faster model for real-time chat
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that answers questions about meeting content, explaining technical concepts clearly to non-technical users. Always format code properly."
          },
          {
            role: "user",
            content: contextPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for consistency
        stream: false
      });

      return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new Error('Failed to send chat message. Please check your OpenAI API key.');
    }
  }, [getOpenAIClient]);

  return {
    generateAnalysis,
    sendChatMessage
  };
}