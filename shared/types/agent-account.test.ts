import type { Hex } from '../lib/delegation/utils';
import type {
  AgentAccountSettings,
  CaveatConfig,
  CaveatType,
  LLMPermissionResponse,
  LLMRequest,
  AgentDelegationResult,
  CreateAgentDelegationParams,
  AgentOutputOptions,
  AgentOutputDocument,
  AgentPermissionRequest,
  AgentPermissionResponse,
  CommunicationChannel,
  AgentAccountState,
} from './agent-account';

const mockAddress = '0x1234567890123456789012345678901234567890' as Hex;
const mockPrivateKey =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hex;
const mockChainId = '0x1' as Hex;

describe('Agent Account Types', () => {
  describe('AgentAccountSettings', () => {
    it('should accept valid Anthropic settings', () => {
      const settings: AgentAccountSettings = {
        llmProvider: 'anthropic',
        apiKey: 'sk-ant-api-key',
        model: 'claude-opus-4-5-20250114',
      };

      expect(settings.llmProvider).toBe('anthropic');
      expect(settings.apiKey).toBe('sk-ant-api-key');
      expect(settings.model).toBe('claude-opus-4-5-20250114');
    });

    it('should accept valid OpenAI settings', () => {
      const settings: AgentAccountSettings = {
        llmProvider: 'openai',
        apiKey: 'sk-openai-key',
        model: 'gpt-4',
      };

      expect(settings.llmProvider).toBe('openai');
    });

    it('should accept custom provider with base URL', () => {
      const settings: AgentAccountSettings = {
        llmProvider: 'custom',
        apiKey: 'custom-key',
        model: 'custom-model',
        customBaseUrl: 'https://custom-llm.example.com/v1',
      };

      expect(settings.llmProvider).toBe('custom');
      expect(settings.customBaseUrl).toBe(
        'https://custom-llm.example.com/v1',
      );
    });
  });

  describe('CaveatConfig', () => {
    it('should accept allowedMethods caveat', () => {
      const caveat: CaveatConfig = {
        type: 'allowedMethods',
        params: {
          methods: ['transfer(address,uint256)', 'approve(address,uint256)'],
        },
      };

      expect(caveat.type).toBe('allowedMethods');
      expect(caveat.params.methods).toHaveLength(2);
    });

    it('should accept erc20BalanceChange caveat', () => {
      const caveat: CaveatConfig = {
        type: 'erc20BalanceChange',
        params: {
          enforceDecrease: true,
          token: mockAddress,
          recipient: mockAddress,
          amount: '1000000000000000000',
        },
      };

      expect(caveat.type).toBe('erc20BalanceChange');
    });

    it('should accept limitedCalls caveat', () => {
      const caveat: CaveatConfig = {
        type: 'limitedCalls',
        params: {
          count: 10,
        },
      };

      expect(caveat.type).toBe('limitedCalls');
      expect(caveat.params.count).toBe(10);
    });

    it('should accept timestamp caveat', () => {
      const caveat: CaveatConfig = {
        type: 'timestamp',
        params: {
          timestampAfterThreshold: 0,
          timestampBeforeThreshold: Math.floor(Date.now() / 1000) + 86400,
        },
      };

      expect(caveat.type).toBe('timestamp');
    });
  });

  describe('LLMPermissionResponse', () => {
    it('should accept valid LLM response', () => {
      const response: LLMPermissionResponse = {
        caveats: [
          {
            type: 'allowedTargets',
            params: { targets: [mockAddress] },
          },
          {
            type: 'limitedCalls',
            params: { count: 5 },
          },
        ],
        explanation:
          'This delegation allows interacting with the specified contract up to 5 times.',
        warnings: ['Ensure you trust this contract address'],
      };

      expect(response.caveats).toHaveLength(2);
      expect(response.explanation).toBeDefined();
      expect(response.warnings).toHaveLength(1);
    });

    it('should accept response with no warnings', () => {
      const response: LLMPermissionResponse = {
        caveats: [],
        explanation: 'Empty delegation with no permissions',
        warnings: [],
      };

      expect(response.warnings).toHaveLength(0);
    });
  });

  describe('LLMRequest', () => {
    it('should accept valid LLM request', () => {
      const request: LLMRequest = {
        systemPrompt: 'You are an expert in delegation framework...',
        userPrompt: 'Allow spending up to 100 USDC on Uniswap',
        config: {
          llmProvider: 'anthropic',
          apiKey: 'test-key',
          model: 'claude-opus-4-5-20250114',
        },
      };

      expect(request.systemPrompt).toBeDefined();
      expect(request.userPrompt).toBeDefined();
      expect(request.config.llmProvider).toBe('anthropic');
    });
  });

  describe('CreateAgentDelegationParams', () => {
    it('should accept valid creation params', () => {
      const params: CreateAgentDelegationParams = {
        userPrompt: 'Allow trading on Uniswap with max 50 USDC per transaction',
        chainId: mockChainId,
        delegatorAddress: mockAddress,
      };

      expect(params.userPrompt).toBeDefined();
      expect(params.chainId).toBe(mockChainId);
      expect(params.delegatorAddress).toBe(mockAddress);
    });
  });

  describe('AgentDelegationResult', () => {
    it('should accept valid delegation result', () => {
      const result: AgentDelegationResult = {
        delegation: {
          delegate: mockAddress,
          delegator: mockAddress,
          authority:
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Hex,
          caveats: [],
          salt: '0x1234' as Hex,
          signature: '0xabcd' as Hex,
        },
        delegateAddress: mockAddress,
        delegatePrivateKey: mockPrivateKey,
        caveats: [],
        explanation: 'This delegation allows...',
        warnings: [],
      };

      expect(result.delegation).toBeDefined();
      expect(result.delegateAddress).toBe(mockAddress);
      expect(result.delegatePrivateKey).toBe(mockPrivateKey);
    });

    it('should accept result with communication channel', () => {
      const result: AgentDelegationResult = {
        delegation: {
          delegate: mockAddress,
          delegator: mockAddress,
          authority:
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Hex,
          caveats: [],
          salt: '0x1234' as Hex,
          signature: '0xabcd' as Hex,
        },
        delegateAddress: mockAddress,
        delegatePrivateKey: mockPrivateKey,
        caveats: [],
        explanation: 'This delegation allows...',
        warnings: [],
        communicationChannelId: 'channel-123',
      };

      expect(result.communicationChannelId).toBe('channel-123');
    });
  });

  describe('AgentOutputDocument', () => {
    it('should accept valid output document', () => {
      const doc: AgentOutputDocument = {
        markdown: '# Agent Delegation\n\nThis document contains...',
        delegationData: '0x1234' as Hex,
        delegatePrivateKey: mockPrivateKey,
      };

      expect(doc.markdown).toContain('# Agent Delegation');
      expect(doc.delegationData).toBeDefined();
      expect(doc.delegatePrivateKey).toBe(mockPrivateKey);
    });
  });

  describe('Phase 2: Communication Channel Types', () => {
    describe('AgentPermissionRequest', () => {
      it('should accept valid permission request', () => {
        const request: AgentPermissionRequest = {
          channelId: 'channel-123',
          agentAddress: mockAddress,
          requestId: 'request-456',
          naturalLanguageRequest: 'I need permission to swap tokens on Curve',
          timestamp: Date.now(),
          status: 'pending',
        };

        expect(request.channelId).toBe('channel-123');
        expect(request.status).toBe('pending');
      });

      it('should accept all status types', () => {
        const statuses: AgentPermissionRequest['status'][] = [
          'pending',
          'approved',
          'denied',
          'modified',
        ];

        statuses.forEach((status) => {
          const request: AgentPermissionRequest = {
            channelId: 'channel-123',
            agentAddress: mockAddress,
            requestId: 'request-456',
            naturalLanguageRequest: 'Test request',
            timestamp: Date.now(),
            status,
          };
          expect(request.status).toBe(status);
        });
      });
    });

    describe('AgentPermissionResponse', () => {
      it('should accept approved response with delegation', () => {
        const response: AgentPermissionResponse = {
          requestId: 'request-456',
          status: 'approved',
          delegation: {
            delegate: mockAddress,
            delegator: mockAddress,
            authority:
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Hex,
            caveats: [],
            salt: '0x1234' as Hex,
            signature: '0xabcd' as Hex,
          },
          userMessage: 'Approved with modifications',
        };

        expect(response.status).toBe('approved');
        expect(response.delegation).toBeDefined();
      });

      it('should accept denied response', () => {
        const response: AgentPermissionResponse = {
          requestId: 'request-456',
          status: 'denied',
          userMessage: 'Request denied for security reasons',
        };

        expect(response.status).toBe('denied');
        expect(response.delegation).toBeUndefined();
      });
    });

    describe('CommunicationChannel', () => {
      it('should accept valid communication channel', () => {
        const channel: CommunicationChannel = {
          id: 'channel-123',
          agentAddress: mockAddress,
          delegatorAddress: mockAddress,
          createdAt: Date.now(),
          pendingRequests: [],
        };

        expect(channel.id).toBe('channel-123');
        expect(channel.pendingRequests).toHaveLength(0);
      });

      it('should accept channel with webhook and pending requests', () => {
        const channel: CommunicationChannel = {
          id: 'channel-123',
          agentAddress: mockAddress,
          delegatorAddress: mockAddress,
          createdAt: Date.now(),
          webhookUrl: 'https://agent.example.com/webhook',
          pendingRequests: [
            {
              channelId: 'channel-123',
              agentAddress: mockAddress,
              requestId: 'request-1',
              naturalLanguageRequest: 'Test request',
              timestamp: Date.now(),
              status: 'pending',
            },
          ],
        };

        expect(channel.webhookUrl).toBe('https://agent.example.com/webhook');
        expect(channel.pendingRequests).toHaveLength(1);
      });
    });

    describe('AgentAccountState', () => {
      it('should accept valid agent account state', () => {
        const state: AgentAccountState = {
          settings: {
            llmProvider: 'anthropic',
            apiKey: 'test-key',
            model: 'claude-opus-4-5-20250114',
          },
          channels: [],
        };

        expect(state.settings.llmProvider).toBe('anthropic');
        expect(state.channels).toHaveLength(0);
      });
    });
  });
});
