import { Interface } from '@ethersproject/abi';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { ARBITRUM_USDC } from '../../../constants/perps';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { AlertsName } from '../constants';
import { useInsufficientPerpsBalanceAlert } from './useInsufficientPerpsBalanceAlert';

const erc20Interface = new Interface([
  'function transfer(address to, uint256 amount)',
]);

function getTransferData(amountRaw: string): Hex {
  return erc20Interface.encodeFunctionData('transfer', [
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    `0x${BigInt(amountRaw).toString(16)}`,
  ]) as Hex;
}

function getAmountRaw(amountHuman: number): string {
  return String(Math.round(amountHuman * 10 ** ARBITRUM_USDC.decimals));
}

function runHook({
  amountHuman = 5,
  availableBalance = '10',
  availableToTradeBalance,
  transactionType = TransactionType.perpsWithdraw,
}: {
  amountHuman?: number;
  availableBalance?: string;
  availableToTradeBalance?: string;
  transactionType?: TransactionType;
} = {}) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    txData: getTransferData(getAmountRaw(amountHuman)),
  }) as TransactionMeta;
  transaction.type = transactionType;
  transaction.txParams.to = ARBITRUM_USDC.address;

  const state = getMockConfirmStateForTransaction(transaction, {
    metamask: {
      accountState: {
        availableBalance,
        ...(availableToTradeBalance === undefined
          ? {}
          : { availableToTradeBalance }),
      },
    },
  });

  return renderHookWithConfirmContextProvider(
    () => useInsufficientPerpsBalanceAlert(),
    state,
  );
}

describe('useInsufficientPerpsBalanceAlert', () => {
  it('returns no alert for non-perps withdraw transactions', () => {
    const { result } = runHook({
      amountHuman: 50,
      availableBalance: '10',
      transactionType: TransactionType.contractInteraction,
    });

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when withdraw amount is within availableToTradeBalance', () => {
    const { result } = runHook({
      amountHuman: 5,
      availableBalance: '0',
      availableToTradeBalance: '10',
    });

    expect(result.current).toStrictEqual([]);
  });

  it('returns blocking alert when withdraw amount exceeds availableToTradeBalance', () => {
    const { result } = runHook({
      amountHuman: 11,
      availableBalance: '100',
      availableToTradeBalance: '10',
    });

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.InsufficientPerpsBalance,
        field: RowAlertKey.Amount,
        isBlocking: true,
        reason: 'Insufficient funds',
        message: 'Amount exceeds your available Perps balance.',
        severity: Severity.Danger,
      },
    ]);
  });

  it('falls back to availableBalance when availableToTradeBalance is absent', () => {
    const { result } = runHook({
      amountHuman: 11,
      availableBalance: '10',
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].key).toBe(AlertsName.InsufficientPerpsBalance);
  });

  it('returns no alert when amount is zero', () => {
    const { result } = runHook({
      amountHuman: 0,
      availableBalance: '0',
    });

    expect(result.current).toStrictEqual([]);
  });
});
