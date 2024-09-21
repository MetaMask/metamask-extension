import { Hex } from '@metamask/utils';
import {
  EXPERIENCES_TYPE,
  FIRST_PARTY_CONTRACT_NAMES,
} from './first-party-contracts';

export const TX_SIG_LEN = 130;
export const EXPERIENCES_TO_VERIFY = [EXPERIENCES_TYPE.METAMASK_BRIDGE];
export const TRUSTED_SIGNERS: Partial<Record<EXPERIENCES_TYPE, Hex>> = {
  [EXPERIENCES_TYPE.METAMASK_BRIDGE]:
    '0x533FbF047Ed13C20e263e2576e41c747206d1348',
};

// look up the corresponding experience provided an address on a chain id
export const getExperience = (
  address: Hex,
  chainId: Hex,
): EXPERIENCES_TYPE | undefined =>
  (
    Object.entries(FIRST_PARTY_CONTRACT_NAMES) as [
      EXPERIENCES_TYPE,
      Record<Hex, Hex>,
    ][]
  ).find(
    ([, chainMap]) =>
      (chainMap[chainId]?.toLowerCase() as Hex) ===
      (address.toLowerCase() as Hex),
  )?.[0];
