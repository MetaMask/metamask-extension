import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { useClaims } from '../../../../contexts/claims/claims';
import { useClaimDraft } from '../../../../hooks/shield/useClaimDraft';
import { useClaimState } from '../../../../hooks/shield/useClaimState';
import { useSubscriptionMetrics } from '../../../../hooks/shield/metrics/useSubscriptionMetrics';
import { submitShieldClaim } from '../../../../store/actions';
import { getLatestShieldSubscription } from '../../../../selectors/subscription';
import ClaimsForm from './claims-form';

const mockNavigate = jest.fn();
const mockSubmitShieldClaim = jest.mocked(submitShieldClaim);
const mockRefetchClaims = jest.fn().mockResolvedValue(undefined);
const mockCaptureShieldClaimSubmissionEvent = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../contexts/claims/claims', () => ({
  useClaims: jest.fn(),
}));

jest.mock('../../../../hooks/shield/useClaimDraft', () => ({
  useClaimDraft: jest.fn(),
}));

jest.mock('../../../../hooks/shield/useClaimState', () => ({
  useClaimState: jest.fn(),
}));

jest.mock('../../../../hooks/shield/metrics/useSubscriptionMetrics', () => ({
  useSubscriptionMetrics: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  submitShieldClaim: jest.fn(),
}));

jest.mock('../../../../selectors/subscription', () => ({
  ...jest.requireActual('../../../../selectors/subscription'),
  getLatestShieldSubscription: jest.fn(),
}));

jest.mock('../account-selector', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../network-selector', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../../components/component-library/file-uploader', () => ({
  FileUploader: () => null,
}));

describe('ClaimsForm metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error - mockResolvedValue is not typed
    mockSubmitShieldClaim.mockResolvedValue(undefined);
    jest.mocked(useClaims).mockReturnValue({
      refetchClaims: mockRefetchClaims,
    } as unknown as ReturnType<typeof useClaims>);
    jest.mocked(useClaimDraft).mockReturnValue({
      hasMaxDrafts: false,
      saveDraft: jest.fn(),
      deleteDraft: jest.fn(),
    } as unknown as ReturnType<typeof useClaimDraft>);
    jest.mocked(useClaimState).mockReturnValue({
      chainId: '0x1',
      setChainId: jest.fn(),
      email: 'user@example.com',
      setEmail: jest.fn(),
      impactedWalletAddress: '0x0000000000000000000000000000000000000001',
      setImpactedWalletAddress: jest.fn(),
      impactedTransactionHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      setImpactedTransactionHash: jest.fn(),
      reimbursementWalletAddress: '0x0000000000000000000000000000000000000002',
      setReimbursementWalletAddress: jest.fn(),
      caseDescription: 'Unauthorized transaction',
      setCaseDescription: jest.fn(),
      files: undefined,
      setFiles: jest.fn(),
      uploadedFiles: [],
      claimSignature:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      currentDraftId: undefined,
    } as unknown as ReturnType<typeof useClaimState>);
    jest.mocked(useSubscriptionMetrics).mockReturnValue({
      captureShieldClaimSubmissionEvent: mockCaptureShieldClaimSubmissionEvent,
      captureShieldCtaClickedEvent: jest.fn(),
    } as unknown as ReturnType<typeof useSubscriptionMetrics>);
    jest.mocked(getLatestShieldSubscription).mockReturnValue({
      status: 'active',
    } as ReturnType<typeof getLatestShieldSubscription>);
  });

  it('tracks started and completed statuses when a claim is submitted', async () => {
    const { getByTestId } = renderWithProvider(
      <ClaimsForm />,
      configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          claimsConfigurations: {
            validSubmissionWindowDays: 10,
            supportedNetworks: ['0x1'],
          },
        },
      }),
      '/',
    );

    await act(async () => {
      fireEvent.click(getByTestId('shield-claim-submit-button'));
    });

    expect(mockSubmitShieldClaim).toHaveBeenCalled();
    expect(mockCaptureShieldClaimSubmissionEvent).toHaveBeenNthCalledWith(1, {
      subscriptionStatus: 'active',
      attachmentsCount: 0,
      status: 'started',
      errorMessage: undefined,
    });
    expect(mockCaptureShieldClaimSubmissionEvent).toHaveBeenNthCalledWith(2, {
      subscriptionStatus: 'active',
      attachmentsCount: 0,
      status: 'completed',
      errorMessage: undefined,
    });
  });
});
