import { EthMethod } from '@metamask/keyring-internal-api';

export const ETH_EOA_METHODS = [
  EthMethod.PersonalSign,
  EthMethod.SignTransaction,
  EthMethod.SignTypedDataV1,
  EthMethod.SignTypedDataV3,
  EthMethod.SignTypedDataV4,
];

export const ETH_4337_METHODS = [
  EthMethod.PrepareUserOperation,
  EthMethod.PatchUserOperation,
  EthMethod.SignUserOperation,
];
