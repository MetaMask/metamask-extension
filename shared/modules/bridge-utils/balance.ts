import { Web3Provider } from '@ethersproject/providers';
import type { Provider } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { getAddress } from 'ethers/lib/utils';
import { fetchTokenBalance } from '../../lib/token-util';
import { Numeric } from '../Numeric';

export const calcLatestSrcBalance = async (
  provider: Provider,
  selectedAddress: string,
  tokenAddress: string,
  chainId: Hex,
): Promise<Numeric | undefined> => {
  if (tokenAddress && chainId) {
    if (tokenAddress === zeroAddress()) {
      const ethersProvider = new Web3Provider(provider);
      return Numeric.from(
        (
          await ethersProvider.getBalance(getAddress(selectedAddress))
        ).toString(),
        10,
      );
    }
    return Numeric.from(
      (
        await fetchTokenBalance(tokenAddress, selectedAddress, provider)
      ).toString(),
      10,
    );
  }
  return undefined;
};

export const hasSufficientBalance = async (
  provider: Provider,
  selectedAddress: string,
  tokenAddress: string,
  fromTokenAmount: string,
  chainId: Hex,
) => {
  const srcTokenBalance = await calcLatestSrcBalance(
    provider,
    selectedAddress,
    tokenAddress,
    chainId,
  );

  return (
    srcTokenBalance?.greaterThanOrEqualTo(Numeric.from(fromTokenAmount, 10)) ??
    false
  );
};
