import * as fs from 'fs/promises';

/**
 * Holds the actual transaction signature captured from sendTransaction.
 * Shared between mock functions so that getSignaturesForAddress and
 * getTransaction return the correct signature.
 */
export type SignatureHolder = { value: string };

export const SOL_TO_USDC_SWAP_SIGNATURE =
  '2m8z8uPZyoZwQpissDbhSfW5XDTFmpc7cSFithc5e1w8iCwFcvVkxHeaVhgFSdgUPb5cebbKGjuu48JMLPjfEATr';

export const USDC_TO_SOL_SWAP_SIGNATURE =
  '28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr';

export const commonSolanaTxConfirmedDetailsFixture = {
  status: 'confirmed',
  amount: '-0.007079 SOL',
  networkFeeFiat: '<$0.01',
  fromAddress: 'HH9ZzgQvSVmznKcRfwHuEphuxk7zU5f92CkXFDQfVJcq',
  toAddress: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
  txHash:
    '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
};

export const commonSolanaTxFailedDetailsFixture = {
  status: 'failed',
  amount: '0.000000005 SOL',
  networkFeeFiat: '<$0.01',
  fromAddress: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
  toAddress: 'AL9Z5JgZdeCKnaYg6jduy9PQGzo3moo7vZYVSTJwnSEq',
  txHash:
    '3dcsK2iXLKHqb5v3bboQvvd7LScajnXENhhxeje2tn3cgQ9e4YJZc7h5QFRypTmYwccAzy4DUskt6R9mXib3Tu1D',
};

export async function readResponseJsonFile(fileName: string): Promise<object> {
  try {
    const fileContents = await fs.readFile(
      `test/e2e/tests/solana/mocks/${fileName}`,
      'utf-8',
    );
    const jsonObject = JSON.parse(fileContents);
    return jsonObject;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to read or parse JSON file: ${error.message}`);
    }
    throw new Error('Failed to read or parse JSON file');
  }
}
