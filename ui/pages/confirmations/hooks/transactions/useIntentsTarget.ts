import { toHex } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { Hex, add0x } from '@metamask/utils';
import { useMemo } from 'react';
import { AssetType } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { NATIVE_TOKEN_ADDRESS } from '../../../../helpers/constants/intents';
import { useConfirmContext } from '../../context/confirm';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { selectTransactionFeeById } from '../../../../selectors';
import { useTokenFiatRates } from './useTokenFiatRate';

export type IntentsTarget = {
  targetTokenAddress: Hex;
  targetAmount: Hex;
};

export function useIntentsTargets() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { assetsWithBalance } = useMultichainBalances();

  const { assets, chainId, id: transactionId, txParams } = transactionMeta;
  const { data, to, value } = txParams;

  const targets: IntentsTarget[] = [];

  const nativeBalance = assetsWithBalance.find(
    (asset) => asset.type === AssetType.native && asset.chainId === chainId,
  );

  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const nativeBalanceRequired = new BigNumber(hexMaximumTransactionFee, 16)
    .mul(1.5)
    .shift(-18);

  const nativeFiatRate = useTokenFiatRates(
    [NATIVE_TOKEN_ADDRESS],
    chainId,
  )?.[0];

  const nativeBalanceRequiredFiat = nativeBalanceRequired.mul(
    nativeFiatRate ?? 1,
  );

  const nativeBalanceOneDollar = new BigNumber(1).div(nativeFiatRate ?? 1);

  if (
    new BigNumber(nativeBalance?.balance ?? '0').lessThan(nativeBalanceRequired)
  ) {
    targets.push({
      targetTokenAddress: NATIVE_TOKEN_ADDRESS,
      targetAmount: add0x(
        new BigNumber(nativeBalanceRequiredFiat).lessThan(1)
          ? nativeBalanceOneDollar.shift(18).toString(16)
          : nativeBalanceRequired.shift(18).toString(16),
      ),
    });
  }

  if (value && value !== '0x0') {
    targets.push({
      targetTokenAddress: NATIVE_TOKEN_ADDRESS,
      targetAmount: value as Hex,
    });
  }

  try {
    const result = new Interface(abiERC20).decodeFunctionData(
      'transfer',
      data ?? '0x',
    );

    const targetAmount = toHex(result._value);

    targets.push({
      targetTokenAddress: to as Hex,
      targetAmount,
    });
  } catch {
    // Intentionally empty
  }

  targets.push(
    ...(assets?.map((asset) => ({
      targetTokenAddress: asset.address,
      targetAmount: asset.amount,
    })) ?? []),
  );

  return useMemo(() => targets, [JSON.stringify(targets)]);
}
