/**
 * System Configuration
 * Central configuration for release testing plan generator
 */

import type { LLMProvider } from './llm-analyzer';

/**
 * Provider configuration with environment variable names
 */
export type ProviderConfig = {
  model: string;
  envKey: string;
};

/**
 * Multi-Provider LLM Configuration
 *
 * Supports automatic fallback between providers when one is unavailable.
 */
export const LLM_CONFIG = {
  /**
   * Provider priority order for automatic fallback
   * The first available provider in this list will be used
   */
  providerPriority: ['openai', 'claude', 'gemini'] as LLMProvider[],

  /**
   * Per-provider configuration
   */
  providers: {
    openai: {
      model: 'gpt-5',
      envKey: 'E2E_OPENAI_API_KEY',
    } as ProviderConfig,
    claude: {
      model: 'claude-opus-4-5-20251101',
      envKey: 'E2E_CLAUDE_API_KEY',
    } as ProviderConfig,
    gemini: {
      model: 'gemini-3-pro-preview',
      envKey: 'E2E_GEMINI_API_KEY',
    } as ProviderConfig,
  },
};

/**
 * Gets the API key for a provider from environment variables
 *
 * @param provider - The LLM provider
 * @returns API key if found, undefined otherwise
 */
export function getApiKeyForProvider(
  provider: LLMProvider,
): string | undefined {
  const config = LLM_CONFIG.providers[provider];
  return process.env[config.envKey];
}

/**
 * Gets the default model for a provider
 *
 * @param provider - The LLM provider
 * @returns Default model name
 */
export function getDefaultModelForProvider(provider: LLMProvider): string {
  return LLM_CONFIG.providers[provider].model;
}

/**
 * Gets the environment variable name for a provider (for error messages)
 *
 * @param provider - The LLM provider
 * @returns Environment variable name
 */
export function getEnvKeyForProvider(provider: LLMProvider): string {
  return LLM_CONFIG.providers[provider].envKey;
}
