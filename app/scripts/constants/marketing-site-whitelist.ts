export const COOKIE_ID_MARKETING_WHITELIST = [
  'https://metamask.io',
  'https://learn.metamask.io',
  'https://mmi-support.zendesk.com/hc/en-us',
  'https://community.metamask.io/',
  'https://support.metamask.io/',
];

// Extract the origin of each URL in the whitelist
export const COOKIE_ID_MARKETING_WHITELIST_ORIGINS =
  COOKIE_ID_MARKETING_WHITELIST.map((url) => new URL(url).origin);
