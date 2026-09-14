import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../../shared/constants/app';
import { showHyperliquidDepositPromptApproval } from './prompt';

describe('showHyperliquidDepositPromptApproval', () => {
  const origin = 'https://app.hyperliquid.xyz';
  const selectedAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  it('adds and shows a Hyperliquid deposit prompt approval', () => {
    const approvalController = {
      addAndShowApprovalRequest: jest.fn().mockResolvedValue(undefined),
      hasRequest: jest.fn().mockReturnValue(false),
    };

    showHyperliquidDepositPromptApproval({
      approvalController,
      origin,
      selectedAddress,
    });

    expect(approvalController.hasRequest).toHaveBeenCalledWith({
      origin,
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    });
    expect(approvalController.addAndShowApprovalRequest).toHaveBeenCalledWith({
      origin,
      requestData: { selectedAddress },
      type: HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE,
    });
  });

  it('does not add another prompt if one is already pending', () => {
    const approvalController = {
      addAndShowApprovalRequest: jest.fn().mockResolvedValue(undefined),
      hasRequest: jest.fn().mockReturnValue(true),
    };

    showHyperliquidDepositPromptApproval({
      approvalController,
      origin,
      selectedAddress,
    });

    expect(approvalController.addAndShowApprovalRequest).not.toHaveBeenCalled();
  });

  it('silently handles rejection when user dismisses the prompt', async () => {
    const approvalController = {
      addAndShowApprovalRequest: jest
        .fn()
        .mockRejectedValue(new Error('User rejected')),
      hasRequest: jest.fn().mockReturnValue(false),
    };

    expect(() =>
      showHyperliquidDepositPromptApproval({
        approvalController,
        origin,
        selectedAddress,
      }),
    ).not.toThrow();
  });
});
