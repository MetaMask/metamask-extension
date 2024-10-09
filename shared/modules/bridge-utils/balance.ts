import { Web3Provider } from '@ethersproject/providers';
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import { HttpProvider } from '../../../types/global';
import { fetchTokenBalance } from '../../lib/token-util';
import { Numeric } from '../Numeric';

export const calcLatestSrcBalance = async (
  provider: HttpProvider,
  selectedAddress: string,
  tokenAddress: string,
  chainId: Hex,
): Promise<Numeric | undefined> => {
  if (tokenAddress && chainId) {
    if (tokenAddress === zeroAddress()) {
      const ethersProvider = new Web3Provider(provider);
      return Numeric.from(
        (await ethersProvider.getBalance(selectedAddress)).toString(),
        10,
      );
    } else {
      return Numeric.from(
        (
          await fetchTokenBalance(
            tokenAddress,
            selectedAddress,
            global.ethereumProvider,
          )
        ).toString(),
        10,
      );
    }
  }

  return;
};

export const hasSufficientBalance = async (
  provider: unknown,
  selectedAddress: string,
  tokenAddress: string,
  fromTokenAmount: string,
  chainId: Hex,
) => {
  const srcTokenBalance = await calcLatestSrcBalance(
    provider as HttpProvider,
    selectedAddress,
    tokenAddress,
    chainId,
  );
  const srcNativeBalance = await calcLatestSrcBalance(
    provider as HttpProvider,
    selectedAddress,
    zeroAddress(),
    chainId,
  );

  const isTokenBalanceGreaterThanRequestedAmount =
    srcTokenBalance?.greaterThanOrEqualTo(Numeric.from(fromTokenAmount, 10)) ??
    false;
  const isNativeBalanceGreaterThanZero =
    srcNativeBalance?.greaterThan(Numeric.from('0', 10)) ?? false;

  return (
    isNativeBalanceGreaterThanZero && isTokenBalanceGreaterThanRequestedAmount
  );
};
