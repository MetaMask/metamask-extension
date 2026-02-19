import type {
  AgentAccountSettings,
  LLMCallResult,
  LLMChatTrace,
  LLMPermissionResponse,
  LLMRequest,
} from '../../types/agent-account';
import { DELEGATION_FRAMEWORK_SYSTEM_PROMPT } from './system-prompts';

/**
 * Error thrown when LLM service encounters an issue
 */
export class LLMServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly provider?: string,
  ) {
    super(message);
    this.name = 'LLMServiceError';
  }
}

/**
 * Default configuration values
 */
export const LLM_DEFAULTS = {
  anthropicBaseUrl:
    process.env.ANTHROPIC_API_BASE_URL || 'https://api.anthropic.com',
  openaiBaseUrl: 'https://api.openai.com',
  defaultModel: process.env.DEFAULT_AGENT_LLM_MODEL || 'claude-opus-4-6',
  maxTokens: 4096,
  temperature: 0.3, // Lower temperature for more deterministic outputs
};

/**
 * Anthropic API message structure
 */
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Anthropic API request body
 */
interface AnthropicRequestBody {
  model: string;
  max_tokens: number;
  temperature: number;
  system: string;
  messages: AnthropicMessage[];
}

/**
 * Anthropic API response structure
 */
interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * OpenAI API request body
 */
interface OpenAIRequestBody {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * OpenAI API response structure
 */
interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Calls the Anthropic Claude API
 *
 * @param request - The LLM request containing prompts and config
 * @returns The parsed LLM response
 */
async function callAnthropic(request: LLMRequest): Promise<string> {
  const baseUrl = request.config.customBaseUrl || LLM_DEFAULTS.anthropicBaseUrl;
  const url = `${baseUrl}/v1/messages`;

  const body: AnthropicRequestBody = {
    model: request.config.model || LLM_DEFAULTS.defaultModel,
    max_tokens: LLM_DEFAULTS.maxTokens,
    temperature: LLM_DEFAULTS.temperature,
    system: request.systemPrompt,
    messages: [
      {
        role: 'user',
        content: request.userPrompt,
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': request.config.apiKey,
      'anthropic-version': '2023-06-01',
      // Required for direct browser requests to Anthropic API
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new LLMServiceError(
      `Anthropic API error: ${response.status} - ${errorText}`,
      response.status,
      'anthropic',
    );
  }

  const data = (await response.json()) as AnthropicResponse;

  const textContent = data.content.find((c) => c.type === 'text');
  if (!textContent) {
    throw new LLMServiceError(
      'No text content in Anthropic response',
      undefined,
      'anthropic',
    );
  }

  return textContent.text;
}

/**
 * Calls the OpenAI API
 *
 * @param request - The LLM request containing prompts and config
 * @returns The raw text response
 */
async function callOpenAI(request: LLMRequest): Promise<string> {
  const baseUrl = request.config.customBaseUrl || LLM_DEFAULTS.openaiBaseUrl;
  const url = `${baseUrl}/v1/chat/completions`;

  const body: OpenAIRequestBody = {
    model: request.config.model || 'gpt-4',
    max_tokens: LLM_DEFAULTS.maxTokens,
    temperature: LLM_DEFAULTS.temperature,
    messages: [
      {
        role: 'system',
        content: request.systemPrompt,
      },
      {
        role: 'user',
        content: request.userPrompt,
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${request.config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new LLMServiceError(
      `OpenAI API error: ${response.status} - ${errorText}`,
      response.status,
      'openai',
    );
  }

  const data = (await response.json()) as OpenAIResponse;

  if (!data.choices || data.choices.length === 0) {
    throw new LLMServiceError(
      'No choices in OpenAI response',
      undefined,
      'openai',
    );
  }

  return data.choices[0].message.content;
}

/**
 * Calls a custom LLM endpoint (OpenAI-compatible format)
 *
 * @param request - The LLM request containing prompts and config
 * @returns The raw text response
 */
async function callCustom(request: LLMRequest): Promise<string> {
  if (!request.config.customBaseUrl) {
    throw new LLMServiceError(
      'Custom provider requires customBaseUrl to be set',
      undefined,
      'custom',
    );
  }

  // Assume OpenAI-compatible API format for custom providers
  return callOpenAI({
    ...request,
    config: {
      ...request.config,
      customBaseUrl: request.config.customBaseUrl,
    },
  });
}

/**
 * Parses the LLM response text into a structured format
 *
 * @param responseText - Raw text from the LLM
 * @returns Parsed LLM permission response
 */
export function parseLLMResponse(responseText: string): LLMPermissionResponse {
  // Try to extract JSON from the response
  // The LLM might wrap it in markdown code fences
  let jsonText = responseText.trim();

  // Remove markdown code fences if present
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!Array.isArray(parsed.caveats)) {
      throw new Error('Response missing caveats array');
    }

    if (typeof parsed.explanation !== 'string') {
      throw new Error('Response missing explanation string');
    }

    // Ensure warnings is an array (default to empty)
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];

    return {
      caveats: parsed.caveats,
      explanation: parsed.explanation,
      warnings,
    };
  } catch (error) {
    throw new LLMServiceError(
      `Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Calls the configured LLM provider to generate permission caveats
 *
 * @param userPrompt - Natural language description of desired permissions
 * @param config - LLM provider configuration
 * @returns Parsed permission response with caveats, explanation, warnings, and full trace
 */
export async function callLLM(
  userPrompt: string,
  config: AgentAccountSettings,
): Promise<LLMCallResult> {
  const request: LLMRequest = {
    systemPrompt: DELEGATION_FRAMEWORK_SYSTEM_PROMPT,
    userPrompt,
    config,
  };

  let responseText: string;

  switch (config.llmProvider) {
    case 'anthropic':
      responseText = await callAnthropic(request);
      break;
    case 'openai':
      responseText = await callOpenAI(request);
      break;
    case 'custom':
      responseText = await callCustom(request);
      break;
    default:
      throw new LLMServiceError(
        `Unknown LLM provider: ${config.llmProvider as string}`,
      );
  }

  const parsedResponse = parseLLMResponse(responseText);

  // Build the trace for debugging
  const trace: LLMChatTrace = {
    systemPrompt: DELEGATION_FRAMEWORK_SYSTEM_PROMPT,
    userPrompt,
    rawResponse: responseText,
    timestamp: Date.now(),
    model: config.model || LLM_DEFAULTS.defaultModel,
    provider: config.llmProvider,
  };

  return {
    response: parsedResponse,
    trace,
  };
}

/**
 * Creates default settings for the LLM service
 *
 * @returns Default agent account settings
 */
export function createDefaultSettings(): AgentAccountSettings {
  return {
    llmProvider: 'anthropic',
    apiKey: '',
    model: LLM_DEFAULTS.defaultModel,
  };
}
