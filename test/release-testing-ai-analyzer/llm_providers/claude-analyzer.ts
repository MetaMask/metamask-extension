/**
 * Claude API integration for analyzing PR changes and generating testing scenarios
 */

// eslint-disable-next-line import/no-named-as-default
import Anthropic from '@anthropic-ai/sdk';
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

export class ClaudeAnalyzer implements LLMAnalyzer {
  private client: Anthropic | null = null;

  private model: string;

  private readonly apiKey: string | undefined;

  private promptBuilder: PromptBuilder;

  constructor(model?: string) {
    this.apiKey = getApiKeyForProvider('claude');
    this.model = model || getDefaultModelForProvider('claude');
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Lazily initialize the Anthropic client
   */
  private getClient(): Anthropic {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error(
          `Claude API key not found. Set ${getEnvKeyForProvider('claude')} environment variable.`,
        );
      }
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
    return this.client;
  }

  /**
   * Analyzes PR changes and generates testing scenarios using Claude
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
      const response = await client.messages.create({
        model: this.model,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Check for truncation
      if (response.stop_reason === 'max_tokens') {
        console.warn(
          '⚠️  Warning: Response was truncated due to token limit. Attempting to parse partial response...',
        );
      }

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      return this.parseClaudeResponse(content.text);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Claude API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parses Claude's JSON response into structured data
   *
   * @param responseText
   */
  private parseClaudeResponse(responseText: string): LLMAnalysisResponse {
    try {
      const jsonText = extractJSONFromResponse(responseText);
      const parsed = JSON.parse(jsonText) as LLMAnalysisResponse;
      return validateAndNormalizeResponse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Failed to parse Claude response as JSON: ${error.message}\nResponse: ${responseText.substring(0, 500)}`,
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
  getProvider(): 'claude' {
    return 'claude';
  }
}
