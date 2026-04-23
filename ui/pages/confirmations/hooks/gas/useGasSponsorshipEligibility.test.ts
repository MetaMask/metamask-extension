import { act } from 'react-dom/test-utils';
import { CHAIN_IDS } from '@metamask/transaction-controller';

import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { estimateGas } from '../../../../store/actions';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useGaslessSupportedSmartTransactions } from './useGaslessSupportedSmartTransactions';
import { useGasSponsorshipCampaign } from './useGasSponsorshipCampaign';
import { useGasSponsorshipDevToggle } from './useGasSponsorshipDevToggle';
import { useGasSponsorshipEligibility } from './useGasSponsorshipEligibility';

jest.mock('../../../../hooks/useAsync', () => ({
  ...jest.requireActual('../../../../hooks/useAsync'),
  useAsyncResult: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  estimateGas: jest.fn(),
}));

jest.mock('./useGaslessSupportedSmartTransactions');
jest.mock('./useGasSponsorshipCampaign');
jest.mock('./useGasSponsorshipDevToggle');

async function runHook({
  isGasFeeSponsored = false,
}: {
  isGasFeeSponsored?: boolean;
} = {}) {
  const confirmation = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.BASE,
    isGasFeeSponsored,
  });

  confirmation.txParams = {
    ...confirmation.txParams,
    gas: '0x5208',
    maxFeePerGas: '0x2',
  };

  const { result, waitForNextUpdate } = renderHookWithConfirmContextProvider(
    useGasSponsorshipEligibility,
    getMockConfirmStateForTransaction(confirmation),
  );

  await act(async () => {
    try {
      await waitForNextUpdate({ timeout: 100 });
    } catch {
      // Hook may already have settled synchronously in some environments.
    }
  });

  return result.current;
}

describe('useGasSponsorshipEligibility', () => {
  const useGaslessSupportedSmartTransactionsMock = jest.mocked(
    useGaslessSupportedSmartTransactions,
  );
  const useGasSponsorshipCampaignMock = jest.mocked(useGasSponsorshipCampaign);
  const useGasSponsorshipDevToggleMock = jest.mocked(
    useGasSponsorshipDevToggle,
  );
  const useAsyncResultMock = jest.mocked(useAsyncResult);
  const estimateGasMock = jest.mocked(estimateGas);

  beforeEach(() => {
    jest.resetAllMocks();

    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });
    useAsyncResultMock.mockReturnValue({
      value: 50_000n,
      pending: false,
      error: undefined,
    } as unknown as ReturnType<typeof useAsyncResult>);
    estimateGasMock.mockResolvedValue('0xc350');
    useGasSponsorshipDevToggleMock.mockReturnValue({
      enabled: true,
      setEnabled: jest.fn(),
      toggle: jest.fn(),
    });
    useGasSponsorshipCampaignMock.mockReturnValue({
      campaign: {
        settlementEscrow: CONTRACT_INTERACTION_SENDER_ADDRESS,
        sponsor: '0x1234567890123456789012345678901234567890',
        remainingBalanceWei: 500000n,
      },
      error: undefined,
      pending: false,
    });
  });

  it('returns eligible when all gates pass and campaign balance is sufficient', async () => {
    const result = await runHook({ isGasFeeSponsored: false });

    expect(result.isEligible).toBe(true);
    expect(result.healthStatus).toBe('ready');
  });

  it('returns ineligible when smart transactions are enabled', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
      pending: false,
    });

    const result = await runHook();

    expect(result.isEligible).toBe(false);
  });

  it('returns insufficient when campaign balance is lower than estimate', async () => {
    useGasSponsorshipCampaignMock.mockReturnValue({
      campaign: {
        settlementEscrow: CONTRACT_INTERACTION_SENDER_ADDRESS,
        sponsor: '0x1234567890123456789012345678901234567890',
        remainingBalanceWei: 1n,
      },
      error: undefined,
      pending: false,
    });

    const result = await runHook();

    expect(result.isEligible).toBe(false);
    expect(result.healthStatus).toBe('insufficient');
  });

  it('returns ineligible when tx sender differs from settlement escrow', async () => {
    useGasSponsorshipCampaignMock.mockReturnValue({
      campaign: {
        settlementEscrow: '0x1234567890123456789012345678901234567899',
        sponsor: '0x1234567890123456789012345678901234567890',
        remainingBalanceWei: 500000n,
      },
      error: undefined,
      pending: false,
    });

    const result = await runHook();

    expect(result.isEligible).toBe(false);
    expect(result.isSettlementEscrowCaller).toBe(false);
    expect(result.healthStatus).toBe('error');
  });
});
