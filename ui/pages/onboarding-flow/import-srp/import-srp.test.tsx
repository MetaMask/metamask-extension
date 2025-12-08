import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { userEvent } from '@testing-library/user-event';
import thunk from 'redux-thunk';
import initializedMockState from '../../../../test/data/mock-state.json';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as Actions from '../../../store/actions';
import ImportSrp from './import-srp';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const mockSubmitSecretRecoveryPhrase = jest.fn();

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('Import SRP', () => {
  const mockState = {
    ...initializedMockState,
    metamask: {
      ...initializedMockState.metamask,
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should route to create password route when keyring is already initialized', () => {
    const mockStore = configureMockStore()(initializedMockState);
    renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    expect(mockUseNavigate).toHaveBeenCalledWith(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
      {
        replace: true,
      },
    );
  });

  it('should render import srp and disable confirm srp button', () => {
    const mockStore = configureMockStore()(mockState);
    const { queryByTestId } = renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    const importSrpTestId = queryByTestId('import-srp');
    expect(importSrpTestId).toBeInTheDocument();

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).toBeDisabled();
  });

  it('should paste and submit srp', async () => {
    const mockStore = configureMockStore()(mockState);

    const { queryByTestId } = renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    srpNote?.focus();

    await userEvent.paste(TEST_SEED);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton as HTMLElement);

    expect(mockSubmitSecretRecoveryPhrase).toHaveBeenCalledWith(TEST_SEED);
    expect(mockUseNavigate).toHaveBeenCalledWith(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
    );
  });

  it('should input and submit srp', async () => {
    const mockStore = configureMockStore()(mockState);

    const { queryByTestId } = renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    srpNote?.focus();

    await userEvent.type(srpNote as HTMLElement, TEST_SEED);
    // fireEvent.change(srpNote, { target: { value: TEST_SEED } });

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton as HTMLElement);

    expect(mockSubmitSecretRecoveryPhrase).toHaveBeenCalledWith(TEST_SEED);
    expect(mockUseNavigate).toHaveBeenCalledWith(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
    );
  });

  it('should reset onboarding flow when back button is clicked', async () => {
    const resetOnboardingSpy = jest
      .spyOn(Actions, 'resetOnboarding')
      .mockReturnValue(jest.fn().mockResolvedValueOnce(null));

    const mockStore = configureMockStore([thunk])(mockState);

    const { queryByTestId } = renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    const backBtn = queryByTestId('import-srp-back-button');
    fireEvent.click(backBtn as HTMLElement);

    await waitFor(() => {
      expect(resetOnboardingSpy).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE, {
        replace: true,
      });
    });
  });
});
