/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ByteArray } from './misc';
import type { TransactionRequestEIP4844 } from './transaction';
import type { MaybeRequired } from './utils';

export type Kzg = {
  /**
   * Convert a blob to a KZG commitment.
   */
  blobToKzgCommitment(blob: ByteArray): ByteArray;
  /**
   * Given a blob, return the KZG proof that is used to verify it against the
   * commitment.
   */
  computeBlobKzgProof(blob: ByteArray, commitment: ByteArray): ByteArray;
};

export type GetTransactionRequestKzgParameter<
  request extends unknown | undefined = undefined,
> = MaybeRequired<
  {
    /** KZG implementation */
    kzg?: Kzg | undefined;
  },
  request extends {
    account: any;
    blobs: TransactionRequestEIP4844['blobs'];
  }
    ? true
    : false
>;
