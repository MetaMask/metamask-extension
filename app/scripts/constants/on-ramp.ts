/**
 * Configuration file for third-party crypto/fiat payment providers.
 *
 * SECURITY WARNING:
 * These API keys (even if marked as 'publishable') should never be hardcoded
 * directly into the source code, especially for frontend applications.
 * They MUST be loaded from environment variables (e.g., .env file, build process)
 * to prevent accidental exposure when the source code is inspected.
 */

// Use process.env or import.meta.env, depending on the environment/framework.
export const API_KEYS = {
  // Transak API Key (Public/Client-side key for URL integration)
  TRANSAK: process.env.TRANSAK_API_KEY,

  // Moonpay Publishable Key (Client-side key)
  MOONPAY: process.env.MOONPAY_API_KEY,

  // CoinbasePay Publishable Key (Client-side key)
  COINBASEPAY: process.env.COINBASEPAY_API_KEY,
};
