import { HYPERLIQUID_DEPOSIT_PROMPT_APPROVAL_TYPE } from '../../../shared/constants/app';
import { showHyperliquidDepositPromptApproval } from './hyperliquid-deposit-prompt';

jest.mock('loglevel', () => ({ error: jest.fn() }));
const mockLogError = jest.requireMock('loglevel').error;

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

  it('logs if the approval is rejected by the user', async () => {
    const error = new Error('User rejected');
    const approvalController = {
      addAndShowApprovalRequest: jest.fn().mockRejectedValue(error),
      hasRequest: jest.fn().mockReturnValue(false),
    };

    showHyperliquidDepositPromptApproval({
      approvalController,
      origin,
      selectedAddress,
    });
    await Promise.resolve();

    expect(mockLogError).toHaveBeenCalledWith(
      'Hyperliquid deposit prompt approval was rejected or failed',
      error,
    );
  });
});
