import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import * as smartTransactionsModule from '../smart-transaction/smart-transactions';
import { MessengerClientFlatState } from '../../messenger-client-init/controller-list';
import { isGasFeeSponsored } from './gas-sponsorship';
import { isSendBundleSupported } from './sentinel-api';
import { isRelaySupported } from './transaction-relay';

jest.mock('../smart-transaction/smart-transactions');
jest.mock('./sentinel-api');
jest.mock('./transaction-relay');

const CHAIN_ID_MOCK = '0x1';
const TO_MOCK = '0x0000000000000000000000000000000000000001';

const TRANSACTION_MOCK: TransactionMeta = {
  chainId: CHAIN_ID_MOCK,
  id: '123',
  isGasFeeSponsoredAvailable: true,
  networkClientId: 'test-network',
  status: TransactionStatus.unapproved,
  time: 1,
  txParams: {
    from: '0x0000000000000000000000000000000000000002',
    to: TO_MOCK,
  },
};

const FEATURE_FLAGS_MOCK = {
  extensionReturnTxHashAsap: false,
  extensionReturnTxHashAsapBatch: false,
  mobileActive: false,
  extensionActive: false,
};

function buildRequest({
  keyringType = 'HD Key Tree',
  optOut = false,
}: { keyringType?: string; optOut?: boolean } = {}) {
  return {
    getFlatState: () =>
      ({
        preferences: {
          gasSponsorshipOptOutByChainId: optOut
            ? { [CHAIN_ID_MOCK]: true }
            : {},
        },
      }) as unknown as MessengerClientFlatState,
    keyringController: {
      getKeyringForAccount: async () => ({ type: keyringType }),
    },
  };
}

describe('isGasFeeSponsored', () => {
  const getSmartTransactionCommonParamsMock = jest.mocked(
    smartTransactionsModule.getSmartTransactionCommonParams,
  );
  const isSendBundleSupportedMock = jest.mocked(isSendBundleSupported);
  const isRelaySupportedMock = jest.mocked(isRelaySupported);

  beforeEach(() => {
    jest.resetAllMocks();

    getSmartTransactionCommonParamsMock.mockReturnValue({
      featureFlags: FEATURE_FLAGS_MOCK,
      isHardwareWalletAccount: false,
      isSmartTransaction: false,
    });
    isSendBundleSupportedMock.mockResolvedValue(false);
    isRelaySupportedMock.mockResolvedValue(true);
  });

  it('returns true when available and the 7702 relay supports the account and chain', async () => {
    expect(await isGasFeeSponsored(buildRequest(), TRANSACTION_MOCK)).toBe(
      true,
    );
  });

  it('returns true when required by the transaction creator', async () => {
    expect(
      await isGasFeeSponsored(buildRequest(), {
        ...TRANSACTION_MOCK,
        forceIsGasFeeSponsored: true,
        isGasFeeSponsoredAvailable: false,
      }),
    ).toBe(true);
  });

  it('returns false when not available or required', async () => {
    expect(
      await isGasFeeSponsored(buildRequest(), {
        ...TRANSACTION_MOCK,
        isGasFeeSponsoredAvailable: false,
      }),
    ).toBe(false);
  });

  it('returns false for revoke delegation transactions', async () => {
    expect(
      await isGasFeeSponsored(buildRequest(), {
        ...TRANSACTION_MOCK,
        type: TransactionType.revokeDelegation,
      }),
    ).toBe(false);
  });

  it('returns false when the user opted out on the chain', async () => {
    expect(
      await isGasFeeSponsored(buildRequest({ optOut: true }), TRANSACTION_MOCK),
    ).toBe(false);
  });

  it('returns true for Smart Transactions with sendBundle, including hardware accounts', async () => {
    getSmartTransactionCommonParamsMock.mockReturnValue({
      featureFlags: FEATURE_FLAGS_MOCK,
      isHardwareWalletAccount: true,
      isSmartTransaction: true,
    });
    isSendBundleSupportedMock.mockResolvedValue(true);

    expect(
      await isGasFeeSponsored(
        buildRequest({ keyringType: 'Ledger Hardware' }),
        TRANSACTION_MOCK,
      ),
    ).toBe(true);
    expect(isRelaySupportedMock).not.toHaveBeenCalled();
  });

  it('returns false for hardware accounts without Smart Transactions', async () => {
    getSmartTransactionCommonParamsMock.mockReturnValue({
      featureFlags: FEATURE_FLAGS_MOCK,
      isHardwareWalletAccount: true,
      isSmartTransaction: false,
    });

    expect(await isGasFeeSponsored(buildRequest(), TRANSACTION_MOCK)).toBe(
      false,
    );
  });

  it('returns false for contract deployments without Smart Transactions', async () => {
    expect(
      await isGasFeeSponsored(buildRequest(), {
        ...TRANSACTION_MOCK,
        txParams: { from: TRANSACTION_MOCK.txParams.from },
      }),
    ).toBe(false);
  });

  it('returns false when the keyring cannot use the 7702 relay', async () => {
    expect(
      await isGasFeeSponsored(
        buildRequest({ keyringType: 'Snap Keyring' }),
        TRANSACTION_MOCK,
      ),
    ).toBe(false);
  });

  it('returns false when the relay does not support the chain', async () => {
    isRelaySupportedMock.mockResolvedValue(false);

    expect(await isGasFeeSponsored(buildRequest(), TRANSACTION_MOCK)).toBe(
      false,
    );
  });

  it('returns true for Money Account deposits required to be sponsored', async () => {
    expect(
      await isGasFeeSponsored(buildRequest(), {
        ...TRANSACTION_MOCK,
        forceIsGasFeeSponsored: true,
        isGasFeeSponsoredAvailable: false,
        nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
        type: TransactionType.batch,
      }),
    ).toBe(true);
    expect(isRelaySupportedMock).not.toHaveBeenCalled();
  });

  describe('Money Account withdrawals', () => {
    const WITHDRAW_MOCK: TransactionMeta = {
      ...TRANSACTION_MOCK,
      forceIsGasFeeSponsored: true,
      isGasFeeSponsoredAvailable: false,
      nestedTransactions: [{ type: TransactionType.moneyAccountWithdraw }],
      type: TransactionType.batch,
    };

    it('returns true when required', async () => {
      expect(await isGasFeeSponsored(buildRequest(), WITHDRAW_MOCK)).toBe(true);
    });

    it('throws when sponsorship is not available', async () => {
      await expect(
        isGasFeeSponsored(buildRequest(), {
          ...WITHDRAW_MOCK,
          forceIsGasFeeSponsored: false,
        }),
      ).rejects.toThrow('Required transaction sponsorship is unavailable');
    });

    it('throws when the user opted out', async () => {
      await expect(
        isGasFeeSponsored(buildRequest({ optOut: true }), WITHDRAW_MOCK),
      ).rejects.toThrow('Required transaction sponsorship is unavailable');
    });
  });
});
