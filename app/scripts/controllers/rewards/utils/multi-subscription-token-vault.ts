// import SecureKeychain from '../../../../SecureKeychain';

// const REWARDS_TOKENS_KEY = 'REWARDS_SUBSCRIPTION_TOKENS';

// const scopeOptions = {
//   service: `com.metamask.${REWARDS_TOKENS_KEY}`,
//   accessible: SecureKeychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
// };

// interface TokenResponse {
//   success: boolean;
//   token?: string;
//   error?: string;
// }

// interface SubscriptionTokensData {
//   tokens: Record<string, string>; // subscriptionId -> tokens
// }

// // TODO: Do we need to define this in another way to be compliant with core?

// /**
//  * Store a session token for a specific subscription
//  */
// export async function storeSubscriptionToken(
//   subscriptionId: string,
//   token: string,
// ): Promise<TokenResponse> {
//   try {
//     // Get existing tokens
//     const existingTokens = await getSubscriptionTokens();
//     const tokens = existingTokens.success ? existingTokens.tokens || {} : {};

//     // Add/update the token for this subscription
//     tokens[subscriptionId] = token;

//     const tokenData: SubscriptionTokensData = { tokens };
//     const stringifiedTokens = JSON.stringify(tokenData);

//     const storeResult = await SecureKeychain.setSecureItem(
//       REWARDS_TOKENS_KEY,
//       stringifiedTokens,
//       scopeOptions,
//     );

//     if (storeResult === false) {
//       return {
//         success: false,
//         error: 'Failed to store subscription token',
//       };
//     }

//     return {
//       success: true,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: (error as Error).message,
//     };
//   }
// }

// /**
//  * Get a session token for a specific subscription
//  */
// export async function getSubscriptionToken(
//   subscriptionId: string,
// ): Promise<TokenResponse> {
//   try {
//     const tokensResult = await getSubscriptionTokens();

//     if (!tokensResult.success || !tokensResult.tokens) {
//       return {
//         success: false,
//         error: 'No tokens found',
//       };
//     }

//     const token = tokensResult.tokens[subscriptionId];
//     if (!token) {
//       return {
//         success: false,
//         error: `No token found for subscription ${subscriptionId}`,
//       };
//     }

//     return {
//       success: true,
//       token,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: (error as Error).message,
//     };
//   }
// }

// /**
//  * Get all subscription tokens
//  */
// export async function getSubscriptionTokens(): Promise<{
//   success: boolean;
//   tokens?: Record<string, string>;
//   error?: string;
// }> {
//   try {
//     const secureItem = await SecureKeychain.getSecureItem(scopeOptions);

//     if (secureItem) {
//       const tokenData: SubscriptionTokensData = JSON.parse(secureItem.value);
//       return {
//         success: true,
//         tokens: tokenData.tokens,
//       };
//     }

//     return {
//       success: true,
//       tokens: {},
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: (error as Error).message,
//     };
//   }
// }

// /**
//  * Remove a token for a specific subscription
//  */
// export async function removeSubscriptionToken(
//   subscriptionId: string,
// ): Promise<TokenResponse> {
//   try {
//     const existingTokens = await getSubscriptionTokens();
//     if (!existingTokens.success || !existingTokens.tokens) {
//       return { success: true }; // Nothing to remove
//     }

//     const tokens = { ...existingTokens.tokens };
//     delete tokens[subscriptionId];

//     const tokenData: SubscriptionTokensData = { tokens };
//     const stringifiedTokens = JSON.stringify(tokenData);

//     const storeResult = await SecureKeychain.setSecureItem(
//       REWARDS_TOKENS_KEY,
//       stringifiedTokens,
//       scopeOptions,
//     );

//     if (storeResult === false) {
//       return {
//         success: false,
//         error: 'Failed to remove subscription token',
//       };
//     }

//     return {
//       success: true,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: (error as Error).message,
//     };
//   }
// }

// /**
//  * Clear all subscription tokens
//  */
// export async function resetAllSubscriptionTokens(): Promise<void> {
//   await SecureKeychain.clearSecureScope(scopeOptions);
// }
