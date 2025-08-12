/**
 * Mock for waitForTransactionHash. Simply replace the waitForTransactionHash
 * with this mock so that we can debug locally without spending gas on mainnet.
 *
 * @returns Promise<string>
 */
export const mockWaitForTransactionHash: () => Promise<string> = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Need a real tx hash to pass some downstream validation
      resolve(
        '0xe3e223b9725765a7de557effdb2b507ace3534bcff2c1fe3a857e0791e56a518',
      );
    }, 20_000_000);
  });
};

/**
 * Mock for signAndSubmitTransactions. Simply replace the signAndSubmitTransactions
 * with this mock so that we can debug locally without spending gas on mainnet.
 *
 * @returns Promise<{ uuid: string; txHash?: string }>
 */
export const mockSignAndSubmitTransactions: () => Promise<{
  uuid: string;
  txHash?: string;
}> = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        uuid: 'uuid123456789',
      });
    }, 100);
  });
};
