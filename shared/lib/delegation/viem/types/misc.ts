import type { OneOf } from './utils';

export type ByteArray = Uint8Array;
export type Hex = `0x${string}`;
export type Hash = `0x${string}`;
export type LogTopic = Hex | Hex[] | null;
export type SignableMessage =
  | string
  | {
      /** Raw data representation of the message. */
      raw: Hex | ByteArray;
    };
export type SignatureLegacy<bigintType = bigint> = {
  r: Hex;
  s: Hex;
  v: bigintType;
};
export type Signature<numberType = number, bigintType = bigint> = OneOf<
  | SignatureLegacy
  | {
      r: Hex;
      s: Hex;
      /** @deprecated use `yParity`. */
      v: bigintType;
      yParity?: numberType | undefined;
    }
  | {
      r: Hex;
      s: Hex;
      /** @deprecated use `yParity`. */
      v?: bigintType | undefined;
      yParity: numberType;
    }
>;
export type CompactSignature = {
  r: Hex;
  yParityAndS: Hex;
};
