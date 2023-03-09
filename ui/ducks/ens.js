import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
const emptyAddress = '0x0000000000000000000000000000000000000000';
export const SLIP44_MSB = 0x80000000;

// Ported from https://github.com/ethers-io/ethers.io/blob/e2592917a1fd84df3b82bd16c1f5d1b4ad082a2d/dist/scripts/ethers-app-v0.5.js#L11272
function hexZeroPad(value, length) {
  while (value.length < 2 * length + 2) {
      value = '0x0' + value.substring(2);
  }
  return value;
}

export const convertEVMChainIdToCoinType = (chainId) => {
  if (chainId >= SLIP44_MSB) {
    throw Error(`chainId ${chainId} must be less than ${SLIP44_MSB}`);
  }
  // eslint-disable-next-line no-bitwise
  return (SLIP44_MSB | chainId) >>> 0;
};

export async function getMulticoinAddress(provider, name, chainId) {
  let address;
  let coinType;
  console.log('***getMulticoinAddres1', {name})
  const resolver = await provider.getResolver(name);
  console.log('***getMulticoinAddres2', {resolver})
  if (resolver) {
    const chainIdInt = parseInt(chainId, 16);
    console.log('***getMulticoinAddres3')
    if(chainIdInt === 1){
      coinType = 60;
    }else{
      coinType = convertEVMChainIdToCoinType(chainIdInt);
    }
    console.log('***getMulticoinAddres4', {chainId, chainIdInt, coinType})
    const hexCoinType = BigNumber.from(coinType).toHexString();
    console.log('***getMulticoinAddres5', {hexCoinType})
    const encodedCoinType = hexZeroPad(hexCoinType, 32);
    console.log('***getMulticoinAddres6', {encodedCoinType})
    // 0xf1cb7e06 is address interface id
    // https://docs.ens.domains/contract-api-reference/publicresolver#get-blockchain-address
    const data = await resolver._fetchBytes('0xf1cb7e06', encodedCoinType);
    console.log('***getMulticoinAddres7', {data})
    if ([emptyAddress, '0x', null].includes(data)) {
      console.log('***getMulticoinAddres8')
      address = emptyAddress;
    }
    address = getAddress(data);
  } else {
    address = emptyAddress;
  }
  console.log('***getMulticoinAddres9', {address})
  return address;
}
