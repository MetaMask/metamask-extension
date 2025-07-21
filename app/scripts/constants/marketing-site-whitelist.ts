export const COOKIE_ID_MARKETING_WHITELIST = [
  'https://metamask.io',
  'https://learn.metamask.io',
  'https://mmi-support.zendesk.com',
  'https://community.metamask.io',
  'https://support.metamask.io',
];

if (process.env.IN_TEST) {
  COOKIE_ID_MARKETING_WHITELIST.push('http://127.0.0.1:8080');
}

// Extract the origin of each URL in the whitelist
export const COOKIE_ID_MARKETING_WHITELIST_ORIGINS =
  COOKIE_ID_MARKETING_WHITELIST.map((url) => new URL(url).origin);
