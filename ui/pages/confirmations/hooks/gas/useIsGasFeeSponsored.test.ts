import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { useGasSponsorshipPreference } from './useGasSponsorshipPreference';
import { useIsGaslessSupported } from './useIsGaslessSupported';
import { useIsGasFeeSponsored } from './useIsGasFeeSponsored';

jest.mock('./useGasSponsorshipPreference');
jest.mock('./useIsGaslessSupported');

const TRANSACTION_META_MOCK = {
  id: '1',
  chainId: '0x1',
  isGasFeeSponsoredAvailable: true,
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
  txParams: {
    from: '0x0000000000000000000000000000000000000001',
    to: '0x0000000000000000000000000000000000000002',
  },
} as unknown as TransactionMeta;

const useGasSponsorshipPreferenceMock = jest.mocked(
  useGasSponsorshipPreference,
);
const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);

function runHook(transactionMeta: TransactionMeta = TRANSACTION_META_MOCK) {
  return renderHookWithConfirmContextProvider(
    useIsGasFeeSponsored,
    getMockConfirmStateForTransaction(transactionMeta),
  ).result.current;
}

describe('useIsGasFeeSponsored', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    useGasSponsorshipPreferenceMock.mockReturnValue({
      isSponsorshipOptedOut: false,
      setSponsorshipOptedOut: jest.fn(),
    });

    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: true,
      pending: false,
    });
  });

  it('returns sponsored when available and gasless is supported', () => {
    expect(runHook()).toStrictEqual({
      isGasFeeSponsored: true,
      isGasFeeSponsorshipEligible: true,
      pending: false,
    });
  });

  it('returns eligible but not sponsored when the user opted out', () => {
    useGasSponsorshipPreferenceMock.mockReturnValue({
      isSponsorshipOptedOut: true,
      setSponsorshipOptedOut: jest.fn(),
    });

    expect(runHook()).toStrictEqual({
      isGasFeeSponsored: false,
      isGasFeeSponsorshipEligible: true,
      pending: false,
    });
  });

  it('returns not sponsored when gasless is not supported', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
      pending: true,
    });

    expect(runHook()).toStrictEqual({
      isGasFeeSponsored: false,
      isGasFeeSponsorshipEligible: false,
      pending: true,
    });
  });

  it('returns not sponsored when sponsorship is only recorded after publish', () => {
    expect(
      runHook({
        ...TRANSACTION_META_MOCK,
        isGasFeeSponsored: true,
        isGasFeeSponsoredAvailable: undefined,
      }).isGasFeeSponsored,
    ).toBe(false);
  });

  it('returns sponsored when required by the transaction creator', () => {
    expect(
      runHook({
        ...TRANSACTION_META_MOCK,
        forceIsGasFeeSponsored: true,
        isGasFeeSponsoredAvailable: undefined,
      }).isGasFeeSponsored,
    ).toBe(true);
  });
});
