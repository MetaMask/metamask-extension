import { handleRewardsErrorMessage } from './handleRewardsErrorMessage';

describe('handleRewardsErrorMessage', () => {
  let t: jest.Mock;

  beforeEach(() => {
    t = jest.fn((key: string) => key);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns generic message when error is not an object', () => {
    const result = handleRewardsErrorMessage('oops', t);
    expect(result).toBe('rewardsErrorMessagesSomethingWentWrong');
    expect(t).toHaveBeenCalledWith('rewardsErrorMessagesSomethingWentWrong');
  });

  it('returns generic message when error is null', () => {
    const result = handleRewardsErrorMessage(null, t);
    expect(result).toBe('rewardsErrorMessagesSomethingWentWrong');
    expect(t).toHaveBeenCalledWith('rewardsErrorMessagesSomethingWentWrong');
  });

  it('returns generic message when message is missing', () => {
    const result = handleRewardsErrorMessage({}, t);
    expect(result).toBe('rewardsErrorMessagesSomethingWentWrong');
    expect(t).toHaveBeenCalledWith('rewardsErrorMessagesSomethingWentWrong');
  });

  it('prioritizes data.message over message and maps already registered', () => {
    const error = {
      data: { message: 'User is already registered for rewards' },
      message: 'some other message',
    };
    const result = handleRewardsErrorMessage(error, t);
    expect(result).toBe('rewardsErrorMessagesAccountAlreadyRegistered');
    expect(t).toHaveBeenCalledWith(
      'rewardsErrorMessagesAccountAlreadyRegistered',
    );
  });

  it('maps "rejected the request" to request rejected message', () => {
    const error = { message: 'User rejected the request on the wallet' };
    const result = handleRewardsErrorMessage(error, t);
    expect(result).toBe('rewardsErrorMessagesRequestRejected');
    expect(t).toHaveBeenCalledWith('rewardsErrorMessagesRequestRejected');
  });

  it('maps "Failed to claim reward" to failed to claim reward message', () => {
    const error = { message: 'Failed to claim reward due to network error' };
    const result = handleRewardsErrorMessage(error, t);
    expect(result).toBe('rewardsErrorMessagesFailedToClaimReward');
    expect(t).toHaveBeenCalledWith('rewardsErrorMessagesFailedToClaimReward');
  });

  it('maps service not available when message includes "not available"', () => {
    const error = { message: 'Rewards service is not available right now' };
    const result = handleRewardsErrorMessage(error, t);
    expect(result).toBe('rewardsErrorMessagesServiceNotAvailable');
    expect(t).toHaveBeenCalledWith('rewardsErrorMessagesServiceNotAvailable');
  });

  it('maps service not available when message includes "Network request failed"', () => {
    const error = { message: 'Network request failed with 503' };
    const result = handleRewardsErrorMessage(error, t);
    expect(result).toBe('rewardsErrorMessagesServiceNotAvailable');
    expect(t).toHaveBeenCalledWith('rewardsErrorMessagesServiceNotAvailable');
  });

  it('returns raw message when no known mappings match', () => {
    const error = { message: 'an unexpected error occurred' };
    const result = handleRewardsErrorMessage(error, t);
    expect(result).toBe('an unexpected error occurred');
    // Should not use translator for raw messages
    expect(t).not.toHaveBeenCalled();
  });
});
