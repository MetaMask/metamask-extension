import { Interface } from '@ethersproject/abi';
import {
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  TELLER_ABI,
} from '@metamask/money-account-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  PaymentOverride,
  type GetPaymentOverrideDataRequest,
} from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import { getMoneyAccountPaymentOverrideData } from './payment-override-callback';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  VAULT_CONFIG_MOCK,
  type MessengerMockOptions,
} from './test-mocks';

const ERC20_INTERFACE = new Interface([
  'function approve(address spender, uint256 amount)',
  'function transfer(address recipient, uint256 amount)',
]);
const TELLER_INTERFACE = new Interface(TELLER_ABI);

const MUSD_ADDRESS = MUSD_TOKEN_ADDRESS_BY_CHAIN[VAULT_CONFIG_MOCK.chainId];

const RECIPIENT_MOCK = '0x1234567890123456789012345678901234567890' as Hex;

/** 2.0000005 mUSD: base units 2000000.5, so UP → 2000001 and DOWN → 2000000. */
const AMOUNT_HUMAN = '2.0000005';
const AMOUNT_ROUNDED_UP = 2000001n;
const AMOUNT_ROUNDED_DOWN = 2000000n;

const SIGNATURE_MOCK = `0x${'12'.repeat(65)}` as Hex;

/**
 * Handlers for the delegation actions the atomic branch exercises. The
 * account reports as already upgraded, which is the launch-state reality for
 * a usable money account, so no authorization list is built.
 *
 * @returns The handlers keyed by action type.
 */
function delegationHandlers(): MessengerMockOptions['handlers'] {
  return {
    'DelegationController:signDelegation': () => SIGNATURE_MOCK,
    'TransactionController:isAtomicBatchSupported': () =>
      Promise.resolve([
        { chainId: VAULT_CONFIG_MOCK.chainId, isSupported: true },
      ]),
  };
}

function buildRequest(
  transactionData: Record<string, unknown>,
): GetPaymentOverrideDataRequest {
  return {
    amount: AMOUNT_HUMAN,
    transaction: {
      id: 'transaction-id-mock',
      chainId: VAULT_CONFIG_MOCK.chainId,
      txParams: { from: RECIPIENT_MOCK },
    } as unknown as TransactionMeta,
    transactionData,
  } as unknown as GetPaymentOverrideDataRequest;
}

const DEPOSIT_DATA = {
  paymentOverride: PaymentOverride.MoneyAccount,
  isPostQuote: true,
};

const WITHDRAW_DATA = {
  paymentOverride: PaymentOverride.MoneyAccount,
};

describe('getMoneyAccountPaymentOverrideData', () => {
  it('returns no calls when the payment override is not the money account', async () => {
    const { messenger, call } = createMoneyPayMessengerMock();

    const result = await getMoneyAccountPaymentOverrideData(
      buildRequest({ paymentOverride: PaymentOverride.Perps }),
      messenger,
    );

    expect(result).toStrictEqual({ calls: [] });
    expect(call).not.toHaveBeenCalled();
  });

  describe('deposit (isPostQuote)', () => {
    it('returns raw approve + deposit calls rounded UP when non-atomic', async () => {
      const { messenger } = createMoneyPayMessengerMock();

      const result = await getMoneyAccountPaymentOverrideData(
        buildRequest({ ...DEPOSIT_DATA, atomic: false }),
        messenger,
      );

      expect(result.recipient).toBe(MONEY_ACCOUNT_ADDRESS_MOCK);
      expect(result.calls).toHaveLength(2);

      const approve = ERC20_INTERFACE.decodeFunctionData(
        'approve',
        result.calls[0].data as string,
      );
      expect(result.calls[0].to?.toLowerCase()).toBe(
        MUSD_ADDRESS.toLowerCase(),
      );
      expect(approve.amount.toBigInt()).toBe(AMOUNT_ROUNDED_UP);

      const deposit = TELLER_INTERFACE.decodeFunctionData(
        'deposit',
        result.calls[1].data as string,
      );
      expect(result.calls[1].to?.toLowerCase()).toBe(
        VAULT_CONFIG_MOCK.tellerAddress.toLowerCase(),
      );
      expect(deposit.depositAmount.toBigInt()).toBe(AMOUNT_ROUNDED_UP);
    });

    it('wraps the calls in a single delegation transaction when atomic', async () => {
      const { messenger, call } = createMoneyPayMessengerMock({
        handlers: delegationHandlers(),
      });

      const result = await getMoneyAccountPaymentOverrideData(
        buildRequest(DEPOSIT_DATA),
        messenger,
      );

      expect(result.recipient).toBe(MONEY_ACCOUNT_ADDRESS_MOCK);
      expect(result.calls).toHaveLength(1);
      // The single call targets the delegation manager, not the vault.
      expect(result.calls[0].to?.toLowerCase()).not.toBe(
        VAULT_CONFIG_MOCK.tellerAddress.toLowerCase(),
      );
      expect(call).toHaveBeenCalledWith(
        'DelegationController:signDelegation',
        expect.objectContaining({ chainId: VAULT_CONFIG_MOCK.chainId }),
      );
      // Already upgraded, so no fresh authorization.
      expect(result.authorizationList).toBeUndefined();
    });

    it('returns no calls when the money account is unavailable', async () => {
      const { messenger } = createMoneyPayMessengerMock({
        moneyAccountAddress: undefined,
      });

      const result = await getMoneyAccountPaymentOverrideData(
        buildRequest(DEPOSIT_DATA),
        messenger,
      );

      expect(result).toStrictEqual({ calls: [] });
    });

    it('returns no calls for a zero amount', async () => {
      const { messenger, provider } = createMoneyPayMessengerMock();

      const result = await getMoneyAccountPaymentOverrideData(
        { ...buildRequest(DEPOSIT_DATA), amount: '0' },
        messenger,
      );

      expect(result).toStrictEqual({ calls: [] });
      expect(provider.request).not.toHaveBeenCalledWith(
        expect.objectContaining({ method: 'eth_call' }),
      );
    });
  });

  describe('withdraw', () => {
    it('returns raw withdraw + transfer calls rounded DOWN when non-atomic', async () => {
      const { messenger } = createMoneyPayMessengerMock();

      const result = await getMoneyAccountPaymentOverrideData(
        buildRequest({ ...WITHDRAW_DATA, atomic: false }),
        messenger,
      );

      expect(result.calls).toHaveLength(2);

      const withdraw = TELLER_INTERFACE.decodeFunctionData(
        'withdraw',
        result.calls[0].data as string,
      );
      expect(result.calls[0].to?.toLowerCase()).toBe(
        VAULT_CONFIG_MOCK.tellerAddress.toLowerCase(),
      );
      // ROUND_DOWN: Max never requests more than the withdrawable balance.
      // The share conversion is ceil(amount * ONE_SHARE / rate).
      expect(withdraw.withdrawAsset.toLowerCase()).toBe(
        MUSD_ADDRESS.toLowerCase(),
      );
      expect(withdraw.to.toLowerCase()).toBe(MONEY_ACCOUNT_ADDRESS_MOCK);

      const transfer = ERC20_INTERFACE.decodeFunctionData(
        'transfer',
        result.calls[1].data as string,
      );
      expect(result.calls[1].to?.toLowerCase()).toBe(
        MUSD_ADDRESS.toLowerCase(),
      );
      expect(transfer.recipient.toLowerCase()).toBe(RECIPIENT_MOCK);
      expect(transfer.amount.toBigInt()).toBe(AMOUNT_ROUNDED_DOWN);
    });

    it('wraps the calls in a single delegation transaction when atomic', async () => {
      const { messenger, call } = createMoneyPayMessengerMock({
        handlers: delegationHandlers(),
      });

      const result = await getMoneyAccountPaymentOverrideData(
        buildRequest(WITHDRAW_DATA),
        messenger,
      );

      expect(result.calls).toHaveLength(1);
      expect(result.calls[0].to?.toLowerCase()).not.toBe(
        VAULT_CONFIG_MOCK.tellerAddress.toLowerCase(),
      );
      expect(call).toHaveBeenCalledWith(
        'DelegationController:signDelegation',
        expect.objectContaining({ chainId: VAULT_CONFIG_MOCK.chainId }),
      );
    });

    it('returns no calls when the transaction has no from address', async () => {
      const { messenger } = createMoneyPayMessengerMock();
      const request = buildRequest(WITHDRAW_DATA);
      (request.transaction as { txParams: object }).txParams = {};

      const result = await getMoneyAccountPaymentOverrideData(
        request,
        messenger,
      );

      expect(result).toStrictEqual({ calls: [] });
    });

    it('returns no calls when the vault config is unserved', async () => {
      const { messenger } = createMoneyPayMessengerMock({
        remoteFeatureFlags: {},
      });

      const result = await getMoneyAccountPaymentOverrideData(
        buildRequest(WITHDRAW_DATA),
        messenger,
      );

      expect(result).toStrictEqual({ calls: [] });
    });

    it('returns no calls for a zero amount', async () => {
      const { messenger, provider } = createMoneyPayMessengerMock();

      const result = await getMoneyAccountPaymentOverrideData(
        { ...buildRequest(WITHDRAW_DATA), amount: '0' },
        messenger,
      );

      expect(result).toStrictEqual({ calls: [] });
      expect(provider.request).not.toHaveBeenCalledWith(
        expect.objectContaining({ method: 'eth_call' }),
      );
    });
  });
});
