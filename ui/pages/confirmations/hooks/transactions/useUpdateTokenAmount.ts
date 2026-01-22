import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import { useConfirmContext } from '../../context/confirm';
import { parseStandardTokenTransactionData } from '../../../../../shared/modules/transaction.utils';
import { getTokenTransferData } from '../../utils/transaction-pay';
import { updateEditableParams } from '../../../../store/actions';
import { updateAtomicBatchData } from '../../../../store/controller-actions/transaction-controller';
import { useTransactionPayRequiredTokens } from '../pay/useTransactionPayData';

const ERC20_ABI = ['function transfer(address to, uint256 amount)'];
let erc20Interface: Interface | null = null;

function getErc20Interface(): Interface {
  if (!erc20Interface) {
    erc20Interface = new Interface(ERC20_ABI);
  }
  return erc20Interface;
}

function calcTokenValue(value: string, decimals: number): BigNumber {
  const multiplier = new BigNumber(10).pow(decimals);
  return new BigNumber(String(value)).times(multiplier);
}

export function useUpdateTokenAmount() {
  const dispatch = useDispatch();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const transactionId = transactionMeta?.id ?? '';
  const [previousAmountRaw, setPreviousAmountRaw] = useState<string>();

  const {
    data,
    to,
    index: nestedCallIndex,
  } = useMemo(
    () =>
      getTokenTransferData(transactionMeta) ?? {
        data: undefined,
        to: undefined,
        index: undefined,
      },
    [transactionMeta],
  );

  const requiredTokens = useTransactionPayRequiredTokens();

  const primaryRequiredToken = useMemo(
    () => requiredTokens?.find((t) => !t.skipIfBalance),
    [requiredTokens],
  );

  const decimals = primaryRequiredToken?.decimals ?? 18;

  const amountRaw = useMemo(() => {
    if (!data) {
      return '0';
    }
    const transactionData = parseStandardTokenTransactionData(data);
    const value = transactionData?.args?._value;
    if (!value) {
      return '0';
    }
    return new BigNumber(value.toString()).toString(10);
  }, [data]);

  const isUpdating =
    Boolean(previousAmountRaw) && amountRaw === previousAmountRaw;

  useEffect(() => {
    if (!isUpdating) {
      setPreviousAmountRaw(undefined);
    }
  }, [isUpdating, transactionId]);

  const updateTokenAmount = useCallback(
    (amountHuman: string) => {
      if (!data || !to) {
        return;
      }

      const newAmountRaw = calcTokenValue(amountHuman, decimals).round(
        0,
        BigNumber.ROUND_UP,
      );

      if (newAmountRaw.eq(amountRaw)) {
        return;
      }

      const transactionData = parseStandardTokenTransactionData(data);
      const recipient = transactionData?.args?._to as string;

      const newData = getErc20Interface().encodeFunctionData('transfer', [
        recipient,
        `0x${newAmountRaw.toString(16)}`,
      ]) as Hex;

      setPreviousAmountRaw(amountRaw);

      if (nestedCallIndex !== undefined) {
        updateAtomicBatchData({
          transactionId,
          transactionIndex: nestedCallIndex,
          transactionData: newData,
        }).catch((error) => {
          console.error(
            'Failed to update token amount in nested transaction',
            error,
          );
        });

        return;
      }

      dispatch(
        updateEditableParams(transactionId, {
          data: newData,
          updateType: false,
        }),
      );
    },
    [amountRaw, data, decimals, dispatch, nestedCallIndex, to, transactionId],
  );

  return {
    isUpdating,
    updateTokenAmount,
  };
}
