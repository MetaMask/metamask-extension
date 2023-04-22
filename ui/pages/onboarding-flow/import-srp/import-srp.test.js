import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import initializedMockState from '../../../../test/data/mock-state.json';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ImportSrp from './import-srp';

const mockHistoryReplace = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    replace: mockHistoryReplace,
  }),
}));

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('Import SRP', () => {
  const mockState = {
    metamask: {
      identities: {},
      selectedAddress: '',
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should route to create password route when keyring is already initialized', () => {
    const mockStore = configureMockStore()(initializedMockState);
    renderWithProvider(<ImportSrp />, mockStore);

    expect(mockHistoryReplace).toHaveBeenCalledWith(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
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

  it('should input and submit srp', () => {
    const mockStore = configureMockStore()(mockState);
    const mockSubmitSecretRecoveryPhrase = jest.fn();

    const { queryByTestId } = renderWithProvider(
      <ImportSrp submitSecretRecoveryPhrase={mockSubmitSecretRecoveryPhrase} />,
      mockStore,
    );

    inputSRP(TEST_SEED, queryByTestId);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton);

    expect(mockSubmitSecretRecoveryPhrase).toHaveBeenCalledWith(TEST_SEED);
    expect(mockHistoryReplace).toHaveBeenCalledWith(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
    );
  });

  function inputSRP(seedStr, queryByTestId) {
    for (const [index, word] of seedStr.split(' ').entries()) {
      const srpInput = queryByTestId(`import-srp__srp-word-${index}`);
      fireEvent.change(srpInput, { target: { value: word } });
    }
  }
});
