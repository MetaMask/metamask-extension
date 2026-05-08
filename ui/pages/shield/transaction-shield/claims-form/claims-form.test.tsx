import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { ClaimsProvider } from '../../../../contexts/claims/claims';
import mockState from '../../../../../test/data/mock-state.json';
import { toast } from '../../../../components/ui/toast/toast';
import * as storeActions from '../../../../store/actions';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';
import { SubmitClaimError } from '../claim-error';
import { CLAIMS_FORM_MODES, SUBMIT_CLAIM_ERROR_CODES } from '../types';
import { ClaimSubmitToastType } from '../../../../../shared/constants/app-state';
import ClaimsForm from './claims-form';

const VALID_TX_HASH = `0x${'a'.repeat(64)}`;

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../account-selector', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({
      label,
      impactedWalletAddress,
      onAccountSelect,
    }: {
      label: string;
      impactedWalletAddress: string;
      onAccountSelect: (address: string) => void;
    }) => (
      <div data-testid="account-selector">
        <label>{label}</label>
        <input
          data-testid="shield-claim-impacted-wallet-address-input"
          value={impactedWalletAddress}
          onChange={(e) => onAccountSelect(e.target.value)}
        />
      </div>
    ),
  };
});

jest.mock('../network-selector', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({
      label,
      selectedChainId,
      onNetworkSelect,
    }: {
      label: string;
      selectedChainId: string;
      onNetworkSelect: (chainId: string) => void;
    }) => (
      <div data-testid="network-selector">
        <label>{label}</label>
        <input
          data-testid="shield-claim-network-selector-input"
          value={selectedChainId}
          onChange={(e) => onNetworkSelect(e.target.value)}
        />
      </div>
    ),
  };
});

describe('Submit Claim Form', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        claimsConfigurations: {
          validSubmissionWindowDays: 10,
          supportedNetworks: ['0x1', '0x5'],
        },
        drafts: [],
      },
    });
  });

  it('should render', () => {
    const { getByTestId } = renderWithProvider(
      <ClaimsProvider>
        <ClaimsForm />
      </ClaimsProvider>,
      store,
    );

    const submitClaimPage = getByTestId('submit-claim-page');
    expect(submitClaimPage).toBeInTheDocument();
  });

  it('should show error when email is invalid', () => {
    const { getByTestId } = renderWithProvider(
      <ClaimsProvider>
        <ClaimsForm />
      </ClaimsProvider>,
      store,
    );

    const emailInput = getByTestId('shield-claim-email-input');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    const errorMessage = getByTestId('shield-claim-help-text');
    expect(errorMessage).toHaveTextContent(
      'Please enter a valid email address',
    );
  });

  it('should show error when reimbursement wallet address is invalid', () => {
    const { getByTestId } = renderWithProvider(
      <ClaimsProvider>
        <ClaimsForm />
      </ClaimsProvider>,
      store,
    );

    const reimbursementWalletAddressInput = getByTestId(
      'shield-claim-reimbursement-wallet-address-input',
    );
    fireEvent.change(reimbursementWalletAddressInput, {
      target: { value: 'incorrect-address' },
    });
    fireEvent.blur(reimbursementWalletAddressInput);

    const errorMessage = getByTestId(
      'shield-claim-reimbursement-wallet-address-help-text',
    );
    expect(errorMessage).toHaveTextContent(
      'Please enter a valid wallet address',
    );
  });

  it('should disable submit button when there are errors', () => {
    const { getByTestId } = renderWithProvider(
      <ClaimsProvider>
        <ClaimsForm />
      </ClaimsProvider>,
      store,
    );

    const submitButton = getByTestId('shield-claim-submit-button');
    expect(submitButton).toBeDisabled();
  });

  function fillValidClaimForm(getByTestId: (id: string) => HTMLElement) {
    fireEvent.change(getByTestId('shield-claim-email-input'), {
      target: { value: 'claimant@example.com' },
    });
    fireEvent.change(
      getByTestId('shield-claim-reimbursement-wallet-address-input'),
      {
        target: { value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
      },
    );
    fireEvent.change(
      getByTestId('shield-claim-impacted-wallet-address-input'),
      {
        target: { value: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
      },
    );
    fireEvent.change(getByTestId('shield-claim-network-selector-input'), {
      target: { value: '0x1' },
    });
    fireEvent.change(getByTestId('shield-claim-impacted-tx-hash-input'), {
      target: { value: VALID_TX_HASH },
    });
    fireEvent.change(getByTestId('shield-claim-description-textarea'), {
      target: { value: 'Description of the incident for coverage.' },
    });
  }

  describe('claim submit toasts', () => {
    beforeEach(() => {
      mockUseNavigate.mockClear();
      jest.spyOn(toast, 'success').mockReturnValue('toast-mock-id');
      jest.spyOn(toast, 'error').mockReturnValue('toast-mock-id');
      jest.spyOn(storeActions, 'getShieldClaims').mockResolvedValue([]);
      jest
        .spyOn(storeActions, 'generateClaimSignature')
        .mockResolvedValue(`0x${'b'.repeat(130)}`);
      jest
        .spyOn(storeActions, 'submitShieldClaim')
        .mockResolvedValue(undefined);
      jest.spyOn(storeActions, 'saveClaimDraft').mockResolvedValue({
        draftId: 'new-draft',
      } as Awaited<ReturnType<typeof storeActions.saveClaimDraft>>);
      jest.spyOn(storeActions, 'deleteClaimDraft').mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calls toast.success after a successful claim submission', async () => {
      const { getByTestId } = renderWithProvider(
        <ClaimsProvider>
          <ClaimsForm />
        </ClaimsProvider>,
        store,
        TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL,
      );

      fillValidClaimForm(getByTestId);

      await waitFor(() => {
        expect(getByTestId('shield-claim-submit-button')).not.toBeDisabled();
      });

      fireEvent.click(getByTestId('shield-claim-submit-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.success)).toHaveBeenCalled();
      });

      const successCall = jest.mocked(toast.success).mock.calls[0][0];
      const successToast = successCall as React.ReactElement<{
        dataTestId?: string;
      }>;
      expect(successToast.props.dataTestId).toBe('claim-submit-toast-success');
      expect(mockUseNavigate).toHaveBeenCalledWith(
        TRANSACTION_SHIELD_CLAIM_ROUTES.BASE,
      );
    });

    it('shows error toast on submit for unmapped server error', async () => {
      jest.spyOn(storeActions, 'submitShieldClaim').mockRejectedValue(
        new SubmitClaimError('Server unavailable', {
          message: 'Server unavailable',
          errorCode: SUBMIT_CLAIM_ERROR_CODES.INTERNAL_SERVER_ERROR,
          statusCode: 500,
        }),
      );

      const { getByTestId } = renderWithProvider(
        <ClaimsProvider>
          <ClaimsForm />
        </ClaimsProvider>,
        store,
        TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL,
      );

      fillValidClaimForm(getByTestId);

      await waitFor(() => {
        expect(getByTestId('shield-claim-submit-button')).not.toBeDisabled();
      });

      fireEvent.click(getByTestId('shield-claim-submit-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.error)).toHaveBeenCalled();
      });

      const errorCall = jest.mocked(toast.error).mock.calls[0][0];
      const errorToast = errorCall as React.ReactElement<{
        dataTestId?: string;
        description?: string;
      }>;
      expect(errorToast.props.dataTestId).toBe('claim-submit-toast-error');
      expect(errorToast.props.description).toBeTruthy();
    });

    it('omits error toast description for Errored toast type', async () => {
      jest.spyOn(storeActions, 'submitShieldClaim').mockRejectedValue(
        new SubmitClaimError(ClaimSubmitToastType.Errored, {
          message: '',
          errorCode: SUBMIT_CLAIM_ERROR_CODES.INTERNAL_SERVER_ERROR,
          statusCode: 500,
        }),
      );

      const { getByTestId } = renderWithProvider(
        <ClaimsProvider>
          <ClaimsForm />
        </ClaimsProvider>,
        store,
        TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL,
      );

      fillValidClaimForm(getByTestId);

      await waitFor(() => {
        expect(getByTestId('shield-claim-submit-button')).not.toBeDisabled();
      });

      fireEvent.click(getByTestId('shield-claim-submit-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.error)).toHaveBeenCalled();
      });

      const erroredCall = jest.mocked(toast.error).mock.calls[0][0];
      const errorToast = erroredCall as React.ReactElement<{
        description?: string;
      }>;
      expect(errorToast.props.description).toBeUndefined();
    });

    it('shows success toast after saving a new draft', async () => {
      const { getByTestId } = renderWithProvider(
        <ClaimsProvider>
          <ClaimsForm />
        </ClaimsProvider>,
        store,
        TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL,
      );

      fireEvent.change(getByTestId('shield-claim-email-input'), {
        target: { value: 'draft@example.com' },
      });

      fireEvent.click(getByTestId('shield-claim-save-draft-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.success)).toHaveBeenCalled();
      });

      const draftCall = jest.mocked(toast.success).mock.calls[0][0];
      const draftToast = draftCall as React.ReactElement<{
        dataTestId?: string;
      }>;
      expect(draftToast.props.dataTestId).toBe('claim-draft-saved-toast');
      expect(mockUseNavigate).toHaveBeenCalledWith(
        TRANSACTION_SHIELD_CLAIM_ROUTES.BASE,
      );
    });

    it('calls toast.error when saving a draft fails', async () => {
      jest
        .spyOn(storeActions, 'saveClaimDraft')
        .mockRejectedValueOnce(new Error('save failed'));

      const { getByTestId } = renderWithProvider(
        <ClaimsProvider>
          <ClaimsForm />
        </ClaimsProvider>,
        store,
        TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL,
      );

      fireEvent.change(getByTestId('shield-claim-email-input'), {
        target: { value: 'draft@example.com' },
      });

      fireEvent.click(getByTestId('shield-claim-save-draft-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.error)).toHaveBeenCalled();
      });

      const saveFailCall = jest.mocked(toast.error).mock.calls[0][0];
      const failToast = saveFailCall as React.ReactElement<{
        dataTestId?: string;
      }>;
      expect(failToast.props.dataTestId).toBe('claim-draft-save-failed-toast');
    });

    it('calls toast.success after deleting a draft', async () => {
      const draftId = 'draft-to-delete';
      const storeWithDraft = configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          claimsConfigurations: {
            validSubmissionWindowDays: 10,
            supportedNetworks: ['0x1', '0x5'],
          },
          drafts: [
            {
              draftId,
              chainId: '0x1',
              email: 'd@example.com',
              impactedWalletAddress:
                '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              impactedTxHash: VALID_TX_HASH,
              reimbursementWalletAddress:
                '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
              description: 'Draft description',
            },
          ],
        },
      });

      const { getByTestId } = renderWithProvider(
        <ClaimsProvider>
          <ClaimsForm mode={CLAIMS_FORM_MODES.EDIT_DRAFT} />
        </ClaimsProvider>,
        storeWithDraft,
        `${TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.FULL}/${draftId}`,
      );

      await waitFor(() => {
        expect(
          getByTestId('shield-claim-delete-draft-button'),
        ).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('shield-claim-delete-draft-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.success)).toHaveBeenCalled();
      });

      const deletedCall = jest.mocked(toast.success).mock.calls[0][0];
      const deletedToast = deletedCall as React.ReactElement<{
        dataTestId?: string;
      }>;
      expect(deletedToast.props.dataTestId).toBe('claim-draft-deleted-toast');
      expect(mockUseNavigate).toHaveBeenCalledWith(
        TRANSACTION_SHIELD_CLAIM_ROUTES.BASE,
      );
    });

    it('calls toast.error when deleting a draft fails', async () => {
      jest
        .spyOn(storeActions, 'deleteClaimDraft')
        .mockRejectedValueOnce(new Error('delete failed'));

      const draftId = 'draft-delete-fail';
      const storeWithDraft = configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          claimsConfigurations: {
            validSubmissionWindowDays: 10,
            supportedNetworks: ['0x1', '0x5'],
          },
          drafts: [
            {
              draftId,
              chainId: '0x1',
              email: 'd@example.com',
              impactedWalletAddress:
                '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              impactedTxHash: VALID_TX_HASH,
              reimbursementWalletAddress:
                '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
              description: 'Draft description',
            },
          ],
        },
      });

      const { getByTestId } = renderWithProvider(
        <ClaimsProvider>
          <ClaimsForm mode={CLAIMS_FORM_MODES.EDIT_DRAFT} />
        </ClaimsProvider>,
        storeWithDraft,
        `${TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.FULL}/${draftId}`,
      );

      await waitFor(() => {
        expect(
          getByTestId('shield-claim-delete-draft-button'),
        ).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('shield-claim-delete-draft-button'));

      await waitFor(() => {
        expect(jest.mocked(toast.error)).toHaveBeenCalled();
      });

      const deleteFailCall = jest.mocked(toast.error).mock.calls[0][0];
      const failToast = deleteFailCall as React.ReactElement<{
        dataTestId?: string;
      }>;
      expect(failToast.props.dataTestId).toBe(
        'claim-draft-delete-failed-toast',
      );
    });
  });
});
