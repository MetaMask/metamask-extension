import { Hex } from '@metamask/utils';
import {
  EXPERIENCES_TYPE,
  FIRST_PARTY_CONTRACT_NAMES,
} from './first-party-contracts';

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
