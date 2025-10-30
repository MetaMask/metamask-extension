// eslint-disable-next-line @typescript-eslint/ban-types
export const handleRewardsErrorMessage = (error: unknown, t: Function) => {
  if (typeof error !== 'object' || error === null) {
    return t('rewardsErrorMessagesSomethingWentWrong');
  }

  const errorObj = error as { data?: { message?: string }; message?: string };
  const message = errorObj?.data?.message ?? errorObj?.message;
  if (!message) {
    return t('rewardsErrorMessagesSomethingWentWrong');
  }
  if (message.includes('already registered')) {
    return t('rewardsErrorMessagesAccountAlreadyRegistered');
  }

  if (message.includes('rejected the request')) {
    return t('rewardsErrorMessagesRequestRejected');
  }

  if (message.includes('Failed to claim reward')) {
    return t('rewardsErrorMessagesFailedToClaimReward');
  }

  if (
    message.includes('not available') ||
    message.includes('Network request failed')
  ) {
    return t('rewardsErrorMessagesServiceNotAvailable');
  }
  return message;
};
