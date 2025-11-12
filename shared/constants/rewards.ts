export const REWARDS_API_URL = {
  UAT: 'https://rewards.uat-api.cx.metamask.io',
  PRD: 'https://rewards.api.cx.metamask.io',
};

// Error message constants for rewards errors
export const REWARDS_ERROR_MESSAGES = {
  AUTHORIZATION_FAILED:
    'Rewards authorization failed. Please login and try again.',
  SEASON_NOT_FOUND:
    'Season not found. Please try again with a different season.',
} as const;
