/**
 * OpenAI GPT API integration for analyzing PR changes and generating testing scenarios
 */

// eslint-disable-next-line import/no-named-as-default
import OpenAI from 'openai';
import type {
  PullRequestInfo,
  FileCategories,
  LLMAnalysisResponse,
} from '../../types';
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

export class OpenAIAnalyzer implements LLMAnalyzer {
  private client: OpenAI | null = null;

  private model: string;

  private readonly apiKey: string | undefined;

  private promptBuilder: PromptBuilder;

  constructor(model?: string) {
    this.apiKey = getApiKeyForProvider('openai');
    this.model = model || getDefaultModelForProvider('openai');
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Lazily initialize the OpenAI client
   */
  private getClient(): OpenAI {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error(
          `OpenAI API key not found. Set ${getEnvKeyForProvider('openai')} environment variable.`,
        );
      }
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  /**
   * Analyzes PR changes and generates testing scenarios using OpenAI GPT
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
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: this.model,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_completion_tokens: 8192, // Increased for GPT-5 to handle larger responses
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        response_format: { type: 'json_object' }, // Force JSON response
      });

      // Check for errors in response
      if (!response.choices || response.choices.length === 0) {
        throw new Error('No choices in OpenAI response');
      }

      const choice = response.choices[0];
      const content = choice.message?.content;

      if (!content) {
        // Log the full response for debugging
        console.error(
          'OpenAI response structure:',
          JSON.stringify(response, null, 2),
        );
        throw new Error(
          'No content in OpenAI response. Response may be incomplete or filtered.',
        );
      }

      // Warn if response was truncated, but try to parse it anyway
      if (choice.finish_reason === 'length') {
        console.warn(
          '⚠️  Warning: Response was truncated due to token limit. Attempting to parse partial response...',
        );
        // Try to extract valid JSON from the partial response
        const trimmedContent = this.extractPartialJSON(content);
        if (trimmedContent) {
          return this.parseOpenAIResponse(trimmedContent);
        }
        throw new Error(
          'Response was truncated and could not be parsed. Try increasing max_completion_tokens or reducing prompt size.',
        );
      }

      if (choice.finish_reason && choice.finish_reason !== 'stop') {
        console.warn(
          `⚠️  Warning: Response finished with reason: ${choice.finish_reason}. Attempting to parse anyway...`,
        );
      }

      return this.parseOpenAIResponse(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Attempts to extract valid JSON from a potentially truncated response
   *
   * @param content
   */
  private extractPartialJSON(content: string): string | null {
    // Try to find the last complete JSON object
    let braceCount = 0;
    let lastValidIndex = -1;

    for (let i = 0; i < content.length; i += 1) {
      if (content[i] === '{') {
        braceCount += 1;
      } else if (content[i] === '}') {
        braceCount -= 1;
        if (braceCount === 0) {
          lastValidIndex = i;
        }
      }
    }

    if (lastValidIndex >= 0) {
      const partialJSON = content.substring(0, lastValidIndex + 1);
      try {
        // Validate it's parseable JSON
        JSON.parse(partialJSON);
        return partialJSON;
      } catch {
        // Not valid JSON, return null
      }
    }

    return null;
  }

  /**
   * Parses OpenAI's JSON response into structured data
   *
   * @param responseText
   */
  private parseOpenAIResponse(responseText: string): LLMAnalysisResponse {
    try {
      const jsonText = extractJSONFromResponse(responseText);
      const parsed = JSON.parse(jsonText) as LLMAnalysisResponse;
      return validateAndNormalizeResponse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Failed to parse OpenAI response as JSON: ${error.message}\nResponse: ${responseText.substring(0, 500)}`,
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
  getProvider(): 'openai' {
    return 'openai';
  }
}
