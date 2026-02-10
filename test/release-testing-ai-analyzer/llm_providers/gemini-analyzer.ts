/**
 * Google Gemini API integration for analyzing PR changes and generating testing scenarios
 */

import type {
  PullRequestInfo,
  FileCategories,
  LLMAnalysisResponse,
} from '../types';
import type { LLMAnalyzer } from './llm-analyzer';
import {
  getApiKeyForProvider,
  getDefaultModelForProvider,
  getEnvKeyForProvider,
} from './config';
import { PromptBuilder } from './prompt-builder';
import {
  extractJSONFromResponse,
  validateAndNormalizeResponse,
} from './response-parser';

type GoogleGenAI = {
  models: {
    generateContent: (params: {
      model: string;
      contents: string;
      generationConfig?: {
        maxOutputTokens?: number;
        responseMimeType?: string;
      };
    }) => Promise<unknown>;
  };
};

export class GeminiAnalyzer implements LLMAnalyzer {
  private client: GoogleGenAI | null = null;

  private model: string;

  private readonly apiKey: string | undefined;

  private promptBuilder: PromptBuilder;

  constructor(model?: string) {
    this.apiKey = getApiKeyForProvider('gemini');
    this.model = model || getDefaultModelForProvider('gemini');
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Lazily initialize the Google GenAI client
   */
  private async getClient(): Promise<GoogleGenAI> {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error(
          `Gemini API key not found. Set ${getEnvKeyForProvider('gemini')} environment variable.`,
        );
      }
      // Use dynamic import for ESM module
      const { GoogleGenAI } = await import('@google/genai');
      this.client = new GoogleGenAI({ apiKey: this.apiKey }) as GoogleGenAI;
    }
    return this.client;
  }

  /**
   * Analyzes PR changes and generates testing scenarios using Google Gemini
   *
   * @param prInfo
   * @param fileCategories
   */
  async analyzePR(
    prInfo: PullRequestInfo,
    fileCategories: FileCategories,
  ): Promise<LLMAnalysisResponse> {
    const prompt = this.promptBuilder.buildAnalysisPrompt(
      prInfo,
      fileCategories,
    );

    try {
      const client = await this.getClient();
      const response = await client.models.generateContent({
        model: this.model,
        contents: prompt,
        generationConfig: {
          maxOutputTokens: 8192,
          responseMimeType: 'application/json', // Force JSON response
        },
      });

      // Check for truncation
      type GeminiResponse = {
        candidates?: {
          finishReason?: string;
          content?: {
            parts?: { text?: string }[];
          };
        }[];
        text?: string;
      };
      const geminiResponse = response as unknown as GeminiResponse;
      const finishReason = geminiResponse.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS' || finishReason === 'max_tokens') {
        console.warn(
          '⚠️  Warning: Response was truncated due to token limit. Attempting to parse partial response...',
        );
      }

      // Extract content from response (handle different response structures)
      let content: string | undefined;

      if (typeof geminiResponse.text === 'string') {
        content = geminiResponse.text;
      } else if (geminiResponse.candidates?.[0]?.content?.parts) {
        // Handle structured response format
        const { parts } = geminiResponse.candidates[0].content;
        content = parts.find((part) => part.text)?.text;
      }

      if (!content) {
        // Log the full response for debugging
        console.error(
          'Gemini response structure:',
          JSON.stringify(response, null, 2),
        );
        throw new Error(
          'No content in Gemini response. Response may be incomplete or filtered.',
        );
      }

      return this.parseGeminiResponse(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parses Gemini's JSON response into structured data
   *
   * @param responseText
   */
  private parseGeminiResponse(responseText: string): LLMAnalysisResponse {
    try {
      const jsonText = extractJSONFromResponse(responseText);
      const parsed = JSON.parse(jsonText) as LLMAnalysisResponse;
      return validateAndNormalizeResponse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Failed to parse Gemini response as JSON: ${error.message}\nResponse: ${responseText.substring(0, 500)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Gets the model name being used
   */
  getModelName(): string {
    return this.model;
  }

  /**
   * Gets the provider name
   */
  getProvider(): 'gemini' {
    return 'gemini';
  }
}
