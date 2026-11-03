import { DAPP_HOST_ADDRESS } from '../../../constants';

export const SIGN_TYPED_DATA_EXPECTED = {
  attachment: '0x',
  contents: 'Hello, Bob!',
  contract: '0xCcCCc...ccccC',
  fromAddress: '0xCD2a3...DD826',
  fromName: 'Cow',
  heading: 'Signature request',
  origin: DAPP_HOST_ADDRESS,
  primaryType: 'Mail',
  toAddress: '0xbBbBB...bBBbB',
  toAddressNum2: '0xB0B0b...00000',
  toName: 'Bob',
  v1Message: 'Hi, Alice!',
} as const;

export const SIGN_TYPED_DATA_V1_INFO = {
  message: SIGN_TYPED_DATA_EXPECTED.v1Message,
  origin: SIGN_TYPED_DATA_EXPECTED.origin,
} as const;

export const SIGN_TYPED_DATA_V3_INFO = {
  contents: SIGN_TYPED_DATA_EXPECTED.contents,
  fromAddress: SIGN_TYPED_DATA_EXPECTED.fromAddress,
  origin: SIGN_TYPED_DATA_EXPECTED.origin,
  toAddress: SIGN_TYPED_DATA_EXPECTED.toAddress,
} as const;

export const SIGN_TYPED_DATA_V4_INFO = {
  ...SIGN_TYPED_DATA_V3_INFO,
  attachment: SIGN_TYPED_DATA_EXPECTED.attachment,
} as const;

export type SignTypedDataV1Info = typeof SIGN_TYPED_DATA_V1_INFO;
export type SignTypedDataV3Info = typeof SIGN_TYPED_DATA_V3_INFO;
export type SignTypedDataV4Info = typeof SIGN_TYPED_DATA_V4_INFO;
