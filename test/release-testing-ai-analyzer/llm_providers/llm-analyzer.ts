/**
 * Abstract LLM analyzer interface for different providers
 */

import type {
  PullRequestInfo,
  FileCategories,
  LLMAnalysisResponse,
} from '../types';

export type LLMProvider = 'claude' | 'openai' | 'gemini';

export type LLMAnalyzer = {
  /**
   * Analyzes PR changes and generates testing scenarios
   */
  analyzePR(
    prInfo: PullRequestInfo,
    fileCategories: FileCategories,
  ): Promise<LLMAnalysisResponse>;

  /**
   * Gets the model name being used
   */
  getModelName(): string;

  /**
   * Gets the provider name
   */
  getProvider(): LLMProvider;
};
