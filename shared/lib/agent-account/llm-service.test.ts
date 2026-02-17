import type { AgentAccountSettings } from '../../types/agent-account';
import {
  callLLM,
  parseLLMResponse,
  createDefaultSettings,
  LLMServiceError,
  LLM_DEFAULTS,
} from './llm-service';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('llm-service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('parseLLMResponse', () => {
    it('should parse valid JSON response', () => {
      const responseText = JSON.stringify({
        caveats: [
          {
            type: 'allowedTargets',
            params: {
              targets: ['0x1234567890123456789012345678901234567890'],
            },
          },
        ],
        explanation: 'This allows interacting with the specified contract.',
        warnings: ['Be careful with this permission.'],
      });

      const result = parseLLMResponse(responseText);

      expect(result.caveats).toHaveLength(1);
      expect(result.caveats[0].type).toBe('allowedTargets');
      expect(result.explanation).toBe(
        'This allows interacting with the specified contract.',
      );
      expect(result.warnings).toHaveLength(1);
    });

    it('should parse JSON wrapped in markdown code fences', () => {
      const responseText = `\`\`\`json
{
  "caveats": [],
  "explanation": "Empty delegation",
  "warnings": []
}
\`\`\``;

      const result = parseLLMResponse(responseText);

      expect(result.caveats).toHaveLength(0);
      expect(result.explanation).toBe('Empty delegation');
    });

    it('should parse JSON wrapped in plain code fences', () => {
      const responseText = `\`\`\`
{
  "caveats": [{"type": "limitedCalls", "params": {"count": 5}}],
  "explanation": "Limited to 5 calls",
  "warnings": []
}
\`\`\``;

      const result = parseLLMResponse(responseText);

      expect(result.caveats).toHaveLength(1);
      expect(result.caveats[0].type).toBe('limitedCalls');
    });

    it('should default warnings to empty array if missing', () => {
      const responseText = JSON.stringify({
        caveats: [],
        explanation: 'Test explanation',
      });

      const result = parseLLMResponse(responseText);

      expect(result.warnings).toEqual([]);
    });

    it('should throw LLMServiceError for missing caveats array', () => {
      const responseText = JSON.stringify({
        explanation: 'Missing caveats',
        warnings: [],
      });

      expect(() => parseLLMResponse(responseText)).toThrow(LLMServiceError);
      expect(() => parseLLMResponse(responseText)).toThrow(
        'Response missing caveats array',
      );
    });

    it('should throw LLMServiceError for missing explanation', () => {
      const responseText = JSON.stringify({
        caveats: [],
        warnings: [],
      });

      expect(() => parseLLMResponse(responseText)).toThrow(LLMServiceError);
      expect(() => parseLLMResponse(responseText)).toThrow(
        'Response missing explanation string',
      );
    });

    it('should throw LLMServiceError for invalid JSON', () => {
      const responseText = 'not valid json';

      expect(() => parseLLMResponse(responseText)).toThrow(LLMServiceError);
      expect(() => parseLLMResponse(responseText)).toThrow(
        'Failed to parse LLM response as JSON',
      );
    });

    it('should parse complex caveat configurations', () => {
      const responseText = JSON.stringify({
        caveats: [
          {
            type: 'erc20BalanceChange',
            params: {
              enforceDecrease: true,
              token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              recipient: '0x0000000000000000000000000000000000000000',
              amount: '100000000',
            },
          },
          {
            type: 'limitedCalls',
            params: {
              count: 10,
            },
          },
        ],
        explanation:
          'Allows spending up to 100 USDC with maximum 10 transactions.',
        warnings: ['No target restriction set.'],
      });

      const result = parseLLMResponse(responseText);

      expect(result.caveats).toHaveLength(2);
      expect(result.caveats[0].type).toBe('erc20BalanceChange');
      expect(result.caveats[0].params.enforceDecrease).toBe(true);
      expect(result.caveats[0].params.amount).toBe('100000000');
      expect(result.caveats[1].type).toBe('limitedCalls');
      expect(result.caveats[1].params.count).toBe(10);
    });
  });

  describe('callLLM', () => {
    const mockConfig: AgentAccountSettings = {
      llmProvider: 'anthropic',
      apiKey: 'test-api-key',
      model: 'claude-opus-4-5-20250114',
    };

    it('should call Anthropic API with correct parameters', async () => {
      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              caveats: [],
              explanation: 'Test',
              warnings: [],
            }),
          },
        ],
        model: 'claude-opus-4-5-20250114',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callLLM('Test prompt', mockConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        `${LLM_DEFAULTS.anthropicBaseUrl}/v1/messages`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('claude-opus-4-5-20250114');
      expect(callBody.messages[0].content).toBe('Test prompt');
      expect(result.caveats).toEqual([]);
    });

    it('should call OpenAI API with correct parameters', async () => {
      const openaiConfig: AgentAccountSettings = {
        llmProvider: 'openai',
        apiKey: 'sk-test-key',
        model: 'gpt-4',
      };

      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                caveats: [],
                explanation: 'Test',
                warnings: [],
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await callLLM('Test prompt', openaiConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        `${LLM_DEFAULTS.openaiBaseUrl}/v1/chat/completions`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk-test-key',
          }),
        }),
      );

      expect(result.caveats).toEqual([]);
    });

    it('should throw LLMServiceError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(callLLM('Test prompt', mockConfig)).rejects.toThrow(
        LLMServiceError,
      );
      await expect(callLLM('Test prompt', mockConfig)).rejects.toThrow(
        'Anthropic API error: 401',
      );
    });

    it('should throw LLMServiceError when Anthropic response has no text content', async () => {
      const mockResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-opus-4-5-20250114',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(callLLM('Test prompt', mockConfig)).rejects.toThrow(
        'No text content in Anthropic response',
      );
    });

    it('should throw LLMServiceError when OpenAI response has no choices', async () => {
      const openaiConfig: AgentAccountSettings = {
        llmProvider: 'openai',
        apiKey: 'sk-test-key',
        model: 'gpt-4',
      };

      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [],
        usage: { prompt_tokens: 100, completion_tokens: 0, total_tokens: 100 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(callLLM('Test prompt', openaiConfig)).rejects.toThrow(
        'No choices in OpenAI response',
      );
    });

    it('should throw for custom provider without customBaseUrl', async () => {
      const customConfig: AgentAccountSettings = {
        llmProvider: 'custom',
        apiKey: 'custom-key',
        model: 'custom-model',
      };

      await expect(callLLM('Test prompt', customConfig)).rejects.toThrow(
        'Custom provider requires customBaseUrl to be set',
      );
    });

    it('should use custom base URL when provided', async () => {
      const customConfig: AgentAccountSettings = {
        llmProvider: 'custom',
        apiKey: 'custom-key',
        model: 'custom-model',
        customBaseUrl: 'https://custom-llm.example.com',
      };

      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                caveats: [],
                explanation: 'Custom test',
                warnings: [],
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await callLLM('Test prompt', customConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-llm.example.com/v1/chat/completions',
        expect.anything(),
      );
    });

    it('should throw for unknown provider', async () => {
      const unknownConfig = {
        llmProvider: 'unknown' as 'anthropic',
        apiKey: 'key',
        model: 'model',
      };

      await expect(callLLM('Test prompt', unknownConfig)).rejects.toThrow(
        'Unknown LLM provider: unknown',
      );
    });
  });

  describe('createDefaultSettings', () => {
    it('should create default settings with Anthropic provider', () => {
      const settings = createDefaultSettings();

      expect(settings.llmProvider).toBe('anthropic');
      expect(settings.apiKey).toBe('');
      expect(settings.model).toBe(LLM_DEFAULTS.defaultModel);
    });
  });

  describe('LLMServiceError', () => {
    it('should create error with all properties', () => {
      const error = new LLMServiceError('Test error', 500, 'anthropic');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.provider).toBe('anthropic');
      expect(error.name).toBe('LLMServiceError');
    });

    it('should create error with just message', () => {
      const error = new LLMServiceError('Simple error');

      expect(error.message).toBe('Simple error');
      expect(error.statusCode).toBeUndefined();
      expect(error.provider).toBeUndefined();
    });
  });
});
