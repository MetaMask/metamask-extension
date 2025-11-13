import { Hex } from '@metamask/utils';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';

export type UniswapPathPool = {
  firstAddress: Hex;
  tickSpacing: number;
  secondAddress: Hex;
};

const ADDRESS_LENGTH = 40;
const TICK_SPACING_LENGTH = 6;

export function decodeCommandV3Path(rawPath: string): UniswapPathPool[] {
  const pools: UniswapPathPool[] = [];
  let remainingData = stripHexPrefix(rawPath);
  let currentPool = {} as UniswapPathPool;
  let isParsingAddress = true;

  while (remainingData.length) {
    if (isParsingAddress) {
      const address = addHexPrefix(
        remainingData.slice(0, ADDRESS_LENGTH),
      ) as Hex;

      if (currentPool.firstAddress) {
        currentPool.secondAddress = address;

        pools.push(currentPool);

        currentPool = {
          firstAddress: address,
        } as UniswapPathPool;
      } else {
        currentPool.firstAddress = address;
      }

      remainingData = remainingData.slice(ADDRESS_LENGTH);
    } else {
      currentPool.tickSpacing = parseInt(
        remainingData.slice(0, TICK_SPACING_LENGTH),
        16,
      );

      remainingData = remainingData.slice(TICK_SPACING_LENGTH);
    }

    isParsingAddress = !isParsingAddress;
  }

  return pools;
}
