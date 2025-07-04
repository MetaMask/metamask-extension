import { toHex } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { Hex, add0x } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { NATIVE_TOKEN_ADDRESS } from '../../../../helpers/constants/intents';
import { useConfirmContext } from '../../context/confirm';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { selectTransactionFeeById } from '../../../../selectors';

export type IntentsTarget = {
  targetTokenAddress: Hex;
  targetAmount: Hex;
};

export function useIntentsTargets() {
  const { assetsWithBalance } = useMultichainBalances();
  const fullTargets = useTargets();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;

  return useMemo(
    () =>
      getPartialTargets(
        getUniqueTargets(fullTargets),
        assetsWithBalance,
        chainId,
      ),
    [fullTargets, assetsWithBalance, chainId],
  );
}

function useTargets() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { assets, id: transactionId, txParams } = transactionMeta ?? {};
  const { data, to, value } = txParams ?? {};

  const gasTarget = useGasTarget(transactionId);
  const valueTarget = useValueTarget(value);
  const tokenTransferTarget = useTokenTransferTarget(data, to);

  const assetTargets = useMemo(
    () =>
      assets?.map((asset) => ({
        targetTokenAddress: asset.address,
        targetAmount: asset.amount,
      })) ?? [],
    [JSON.stringify(assets)],
  );

  return useMemo(() => {
    return [
      ...(gasTarget ? [gasTarget] : []),
      ...(valueTarget ? [valueTarget] : []),
      ...(tokenTransferTarget ? [tokenTransferTarget] : []),
      ...assetTargets,
    ];
  }, [gasTarget, valueTarget, tokenTransferTarget, assetTargets]);
}

function useTokenTransferTarget(
  data: string | undefined,
  to: string | undefined,
) {
  let targetAmount: Hex | undefined;

  try {
    const result = new Interface(abiERC20).decodeFunctionData(
      'transfer',
      data ?? '0x',
    );

    targetAmount = toHex(result._value);
  } catch {
    // Intentionally empty
  }

  return useMemo(() => {
    if (!targetAmount || !to) {
      return undefined;
    }

    return {
      targetTokenAddress: to as Hex,
      targetAmount,
    };
  }, [targetAmount, to]);
}

function useValueTarget(value: string | undefined) {
  return useMemo(() => {
    if (!value || value === '0x0') {
      return undefined;
    }

    return {
      targetTokenAddress: NATIVE_TOKEN_ADDRESS,
      targetAmount: value as Hex,
    };
  }, [value]);
}

function useGasTarget(transactionId: string) {
  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const gasFeeWei = add0x(
    new BigNumber(hexMaximumTransactionFee, 16).shift(-9).toString(16),
  );

  return useMemo(() => {
    return {
      targetTokenAddress: NATIVE_TOKEN_ADDRESS,
      targetAmount: gasFeeWei,
    };
  }, [gasFeeWei]);
}

function getPartialTargets(
  targets: IntentsTarget[],
  balances: ReturnType<typeof useMultichainBalances>['assetsWithBalance'],
  chainId: Hex,
): IntentsTarget[] {
  return targets.reduce((acc, target) => {
    const asset = balances.find(
      (asset) =>
        (asset.address.toLowerCase() ===
          target.targetTokenAddress.toLowerCase() ||
          (asset.isNative &&
            target.targetTokenAddress === NATIVE_TOKEN_ADDRESS)) &&
        asset.chainId === chainId,
    );

    if (!asset?.balance) {
      acc.push({
        ...target,
      });
      return acc;
    }

    const { balance } = asset;
    const decimals = asset.decimals ?? 18;

    const requiredBalance = new BigNumber(target.targetAmount, 16)
      .shift(-decimals)
      .minus(balance);

    const requiredBalanceRaw = add0x(
      requiredBalance.shift(decimals).toString(16),
    );

    if (requiredBalance.lessThanOrEqualTo(0)) {
      return acc;
    }

    acc.push({
      ...target,
      targetAmount: requiredBalanceRaw,
    });

    return acc;
  }, [] as IntentsTarget[]);
}

function getUniqueTargets(targets: IntentsTarget[]): IntentsTarget[] {
  return targets.reduce((acc, target) => {
    const existingTarget = acc.find(
      (t) =>
        t.targetTokenAddress.toLowerCase() ===
        target.targetTokenAddress.toLowerCase(),
    );

    if (existingTarget) {
      existingTarget.targetAmount = add0x(
        new BigNumber(existingTarget.targetAmount, 16)
          .plus(new BigNumber(target.targetAmount, 16))
          .toString(16),
      );
    } else {
      acc.push({ ...target });
    }

    return acc;
  }, [] as IntentsTarget[]);
}
