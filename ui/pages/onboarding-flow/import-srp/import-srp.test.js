import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { userEvent } from '@testing-library/user-event';
import initializedMockState from '../../../../test/data/mock-state.json';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import ImportSrp from './import-srp';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockNavigate,
  };
});

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('Import SRP', () => {
  const mockState = {
    metamask: {
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
    renderWithProvider(<ImportSrp />, mockStore);

    expect(mockNavigate).toHaveBeenCalledWith(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
      {
        replace: true,
      },
    );
  });

  it('should render import srp and disable confirm srp button', () => {
    const mockStore = configureMockStore()(mockState);
    const { queryByTestId } = renderWithProvider(<ImportSrp />, mockStore);

    const importSrpTestId = queryByTestId('import-srp');
    expect(importSrpTestId).toBeInTheDocument();

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).toBeDisabled();
  });

  it('should paste and submit srp', async () => {
    const mockStore = configureMockStore()(mockState);
    const mockSubmitSecretRecoveryPhrase = jest.fn();

    const { queryByTestId } = renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    srpNote.focus();

    await userEvent.paste(TEST_SEED);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton);

    expect(mockSubmitSecretRecoveryPhrase).toHaveBeenCalledWith(TEST_SEED);
    expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_CREATE_PASSWORD_ROUTE);
  });

  it('should input and submit srp', async () => {
    const mockStore = configureMockStore()(mockState);
    const mockSubmitSecretRecoveryPhrase = jest.fn();

    const { queryByTestId } = renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    srpNote.focus();

    await userEvent.type(srpNote, TEST_SEED);
    // fireEvent.change(srpNote, { target: { value: TEST_SEED } });

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton);

    expect(mockSubmitSecretRecoveryPhrase).toHaveBeenCalledWith(TEST_SEED);
    expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_CREATE_PASSWORD_ROUTE);
  });
});
