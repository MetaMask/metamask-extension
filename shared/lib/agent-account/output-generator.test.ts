import type { Hex } from '@metamask/utils';
import type { AgentOutputOptions } from '../../types/agent-account';
import type { Delegation, Caveat } from '../delegation';
import {
  generateAgentOutput,
  formatOutputForDownload,
  extractDelegationDataForCopy,
} from './output-generator';

const mockDelegatorAddress =
  '0x1234567890123456789012345678901234567890' as Hex;
const mockDelegateAddress =
  '0x0987654321098765432109876543210987654321' as Hex;
const mockPrivateKey =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hex;
const mockSignature =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Hex;
const mockChainId = '0x1' as Hex;
const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Hex;

const mockEnforcerAddress =
  '0x2000000000000000000000000000000000000001' as Hex;

describe('output-generator', () => {
  describe('generateAgentOutput', () => {
    it('should generate output for delegation with no caveats', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Full access to my account',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Full authority delegation with no restrictions',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('# Agent Delegation Package');
      expect(result.markdown).toContain(mockDelegatorAddress);
      expect(result.markdown).toContain(mockDelegateAddress);
      expect(result.markdown).toContain('Full access to my account');
      expect(result.markdown).toContain('NO caveats');
      expect(result.markdown).toContain('FULL authority');
      expect(result.delegationData).toMatch(/^0x[0-9a-fA-F]+$/u);
      expect(result.delegatePrivateKey).toBe(mockPrivateKey);
    });

    it('should generate output for delegation with caveats', () => {
      const caveats: Caveat[] = [
        {
          enforcer: mockEnforcerAddress,
          terms: '0xabcd' as Hex,
          args: '0x' as Hex,
        },
      ];

      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats,
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Allow spending up to 100 USDC',
        caveats,
        chainId: mockChainId,
        explanation: 'Limited USDC spending capability',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('# Agent Delegation Package');
      expect(result.markdown).toContain('1 caveat');
      expect(result.markdown).toContain('Limited USDC spending capability');
      expect(result.markdown).toContain(mockEnforcerAddress);
      expect(result.markdown).toContain('0xabcd');
    });

    it('should include communication channel section when provided', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test delegation',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
        communicationChannelId: 'channel-123-456',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('Communication Channel');
      expect(result.markdown).toContain('channel-123-456');
      expect(result.markdown).toContain('Permission Requests');
    });

    it('should not include communication channel section when not provided', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test delegation',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).not.toContain('Communication Channel');
    });

    it('should include framework documentation links', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain(
        'https://github.com/MetaMask/delegation-framework',
      );
      expect(result.markdown).toContain(
        'https://eips.ethereum.org/EIPS/eip-7715',
      );
    });

    it('should include gator-cli documentation', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('Gator-CLI');
      expect(result.markdown).toContain(
        'https://github.com/MetaMask/gator-cli',
      );
      expect(result.markdown).toContain('gator init');
      expect(result.markdown).toContain('gator redeem');
      expect(result.markdown).toContain('gator status');
    });

    it('should include re-delegation documentation', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('Re-delegation');
      expect(result.markdown).toContain('Sub-Permissions');
      expect(result.markdown).toContain('delegation chain');
    });

    it('should include code example for using delegation', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('encodeRedeemDelegations');
      expect(result.markdown).toContain('```typescript');
    });

    it('should include security reminders', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('Security Reminders');
      expect(result.markdown).toContain('Store the private key securely');
      expect(result.markdown).toContain('Revoke if compromised');
    });

    it('should show correct authority type for root delegation', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('Root (direct delegation)');
    });

    it('should show correct authority type for chained delegation', () => {
      const parentHash =
        '0xaabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd' as Hex;

      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: parentHash,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('Chained');
      expect(result.markdown).toContain('0xaabb...ccdd');
    });

    it('should include raw delegation JSON', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('Raw Delegation Object');
      expect(result.markdown).toContain('"delegate":');
      expect(result.markdown).toContain('"delegator":');
      expect(result.markdown).toContain('"authority":');
    });

    it('should handle multiple caveats', () => {
      const caveats: Caveat[] = [
        {
          enforcer: mockEnforcerAddress,
          terms: '0xaaaa' as Hex,
          args: '0x' as Hex,
        },
        {
          enforcer:
            '0x2000000000000000000000000000000000000002' as Hex,
          terms: '0xbbbb' as Hex,
          args: '0x' as Hex,
        },
        {
          enforcer:
            '0x2000000000000000000000000000000000000003' as Hex,
          terms: '0xcccc' as Hex,
          args: '0x' as Hex,
        },
      ];

      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats,
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Multiple restrictions',
        caveats,
        chainId: mockChainId,
        explanation: 'Multiple caveats applied',
      };

      const result = generateAgentOutput(options);

      expect(result.markdown).toContain('3 caveats');
      expect(result.markdown).toContain('Caveat 1');
      expect(result.markdown).toContain('Caveat 2');
      expect(result.markdown).toContain('Caveat 3');
    });
  });

  describe('formatOutputForDownload', () => {
    it('should return the markdown content', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const output = generateAgentOutput(options);
      const downloadContent = formatOutputForDownload(output);

      expect(downloadContent).toBe(output.markdown);
    });
  });

  describe('extractDelegationDataForCopy', () => {
    it('should return just the delegation data', () => {
      const delegation: Delegation = {
        delegate: mockDelegateAddress,
        delegator: mockDelegatorAddress,
        authority: ROOT_AUTHORITY,
        caveats: [],
        salt: '0x1234' as Hex,
        signature: mockSignature,
      };

      const options: AgentOutputOptions = {
        delegation,
        delegateAddress: mockDelegateAddress,
        delegatePrivateKey: mockPrivateKey,
        originalPrompt: 'Test',
        caveats: [],
        chainId: mockChainId,
        explanation: 'Test',
      };

      const output = generateAgentOutput(options);
      const delegationData = extractDelegationDataForCopy(output);

      expect(delegationData).toBe(output.delegationData);
      expect(delegationData).toMatch(/^0x[0-9a-fA-F]+$/u);
    });
  });
});
