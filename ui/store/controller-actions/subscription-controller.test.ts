import { submitRequestToBackground } from '../background-connection';
import { getIsEligibleForSubscriptionTrial } from './subscription-controller';

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('getIsEligibleForSubscriptionTrial', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
  });

  it('checks the product through the subscription controller messenger action', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(false);

    const result =
      await getIsEligibleForSubscriptionTrial('money_account_plus');

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'SubscriptionController:isUserEligibleForTrial',
      ['money_account_plus'],
    );
    expect(result).toBe(false);
  });

  it('propagates a trial eligibility error from the background', async () => {
    const error = new Error('Trial eligibility check failed');
    mockSubmitRequestToBackground.mockRejectedValue(error);

    await expect(
      getIsEligibleForSubscriptionTrial('money_account_plus'),
    ).rejects.toBe(error);
  });
});
