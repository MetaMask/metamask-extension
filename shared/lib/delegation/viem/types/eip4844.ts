import type { ByteArray, Hex } from './misc';

export type BlobSidecar<type extends Hex | ByteArray = Hex | ByteArray> = {
  /** The blob associated with the transaction. */
  blob: type;
  /** The KZG commitment corresponding to this blob. */
  commitment: type;
  /** The KZG proof corresponding to this blob and commitment. */
  proof: type;
};
export type BlobSidecars<type extends Hex | ByteArray = Hex | ByteArray> =
  BlobSidecar<type>[];
