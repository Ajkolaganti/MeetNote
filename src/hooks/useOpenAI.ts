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

  const generateAnalysis = useCallback(async (
    transcript: string,
    onToken?: (partial: string) => void
  ): Promise<string> => {
    const openai = getOpenAIClient();

    /* ---------- UPDATED PROMPT ---------- */
    const prompt = `You are an AI meeting assistant. Analyze the following meeting transcript and provide a comprehensive analysis.

IMPORTANT GUIDELINES
1. Assume the audience has **no technical background** – explain everything in simple terms.
2. If the transcript already contains *actual* code, SQL, or API snippets, include each snippet verbatim **and** explain in plain English what it does.
3. **Do NOT invent or add new code**. If the transcript only *talks* about coding but shows none, summarize the discussion; do not create code examples.
4. Use analogies and real-world comparisons for complex ideas.
5. Structure your answer with clear markdown headings.
6. End with "Action Items" and "Next Steps".
7. Use \`inline code\` for single terms and \`\`\`code blocks\`\`\` for snippets that were actually present.

Meeting Transcript:
${transcript}

Return the analysis in markdown with these sections:
1. **Executive Summary**
2. **Key Discussion Points**
3. **Technical Details** (include snippets *only if present*)
4. **Plain-English Explanations**
5. **Action Items**
6. **Next Steps**`;
    /* ---------- END UPDATED PROMPT ---------- */

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful AI assistant that specializes in analyzing meeting transcripts. ' +
              'Explain technical concepts to non-technical users and only reproduce code that is already provided.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        stream: true
      });

      let content = '';
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (!delta) continue;

        content += delta;
        if (onToken) {
          onToken(content);
        }
      }
      return content || 'No analysis generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate analysis.');
    }
  }, [getOpenAIClient]);

  const sendChatMessage = useCallback(
    async (
      message: string,
      transcript: string,
      analysis: string,
      onToken?: (partial: string) => void
    ): Promise<string> => {
      // ---------- NEW EARLY GUARDS ----------
      if (!transcript?.trim()) {
        return '❌ I dont have any meeting transcript yet, so I cant answer that question.';
      }
      if (!analysis?.trim()) {
        return '❌ A meeting analysis hasnt been generated yet. Please run the analysis first.';
      }
      // ---------------------------------------

      const openai = getOpenAIClient();

      const contextPrompt = `You are an AI assistant answering follow-up questions about a meeting.

MEETING TRANSCRIPT:
${transcript}

PREVIOUS ANALYSIS:
${analysis}

USER QUESTION:
${message}

STRICT RULES:
• Answer **only** with information that appears in the transcript or analysis.  
• If the answer cannot be found there, reply:  
  "❌ Sorry, that information was not discussed in the meeting."  
• Do **not** fabricate or guess.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant who must answer strictly from the provided meeting context. ' +
                'If the context is missing or does not contain the answer, politely refuse.'
            },
            { role: 'user', content: contextPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.3,
          stream: true
        });

        let content = '';
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (!delta) continue;

          content += delta;
          if (onToken) {
            onToken(content);
          }
        }
        return (
          content || '❌ Sorry, that information was not discussed in the meeting.'
        );
      } catch (error) {
        console.error('OpenAI chat error:', error);
        throw new Error('Failed to send chat message.');
      }
    },
    [getOpenAIClient]
  );

  return { generateAnalysis, sendChatMessage };
}