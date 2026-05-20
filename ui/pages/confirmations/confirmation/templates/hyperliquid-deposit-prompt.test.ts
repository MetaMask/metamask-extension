import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/utils';
import hyperliquidDepositPrompt from './hyperliquid-deposit-prompt';

describe('hyperliquidDepositPrompt', () => {
  describe('getValues', () => {
    it('returns a Hyperliquid deposit prompt template that resolves the approval', () => {
      const resolvePendingApproval = jest.fn();
      const pendingApproval = {
        id: 'approval-id',
        origin: 'https://app.hyperliquid.xyz',
        requestData: {
          selectedAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
        expectsResult: false,
        time: Date.now(),
        requestState: null,
        type: 'hyperliquid_deposit_prompt',
      } as ApprovalRequest<Record<string, Json>>;

      const values = hyperliquidDepositPrompt.getValues(
        pendingApproval,
        jest.fn(),
        { resolvePendingApproval },
      );

      expect(values.hideSubmitButton).toBe(true);
      expect(values.content).toHaveLength(1);
      expect(values.content[0]).toMatchObject({
        element: 'HyperliquidDepositPrompt',
        key: 'hyperliquid-deposit-prompt',
        props: {
          selectedAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      });

      values.content[0].props.onActionComplete({
        started: true,
        transactionId: 'tx-id',
      });

      expect(resolvePendingApproval).toHaveBeenCalledWith('approval-id', {
        started: true,
        transactionId: 'tx-id',
      });
    });
  });
});
