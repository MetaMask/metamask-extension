import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { hexZeroPad } from '@ethersproject/bytes';

const emptyAddress = '0x0000000000000000000000000000000000000000';
const SLIP44_MSB = 0x80000000;

export const convertEVMChainIdToCoinType = (chainId) => {
  if (chainId >= SLIP44_MSB) {
    throw Error(`chainId ${chainId} must be less than ${SLIP44_MSB}`);
  }
  // eslint-disable-next-line no-bitwise
  return (SLIP44_MSB | chainId) >>> 0;
};

export async function getEVMChainAddress(provider, name, chainId) {
  let address;
  let coinType;
  const resolver = await provider.getResolver(name);
  if (resolver) {
    const chainIdInt = parseInt(chainId, 16);
    if (chainIdInt === 1) {
      coinType = 60;
    } else {
      coinType = convertEVMChainIdToCoinType(chainIdInt);
    }
    const hexCoinType = BigNumber.from(coinType).toHexString();
    const encodedCoinType = hexZeroPad(hexCoinType, 32);
    // 0xf1cb7e06 is address interface id
    // https://docs.ens.domains/contract-api-reference/publicresolver#get-blockchain-address
    const data = await resolver._fetchBytes('0xf1cb7e06', encodedCoinType);
    if ([emptyAddress, '0x', null].includes(data)) {
      address = emptyAddress;
    }
    address = getAddress(data);
  } else {
    address = emptyAddress;
  }
  return address;
}
