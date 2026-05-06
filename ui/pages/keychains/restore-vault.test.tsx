import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { userEvent } from '@testing-library/user-event';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import * as actions from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import RestoreVaultPage from './restore-vault';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));
jest.mock('../../store/actions', () => ({
  createNewVaultAndRestore: jest.fn(),
  resetOAuthLoginState: jest.fn(),
  resetWallet: jest.fn(),
  setFirstTimeFlowType: jest.fn(),
  unMarkPasswordForgotten: jest.fn(),
}));

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('Restore vault Component', () => {
  const mockStore = configureMockStore([thunk]);

  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.clearAllMocks();
    jest
      .mocked(actions.unMarkPasswordForgotten)
      .mockReturnValue({ type: 'MOCK' });
  });

  it('renders match snapshot', () => {
    const { container } = renderWithProvider(
      <RestoreVaultPage />,
      mockStore({
        metamask: { currentLocale: 'en' },
        appState: { isLoading: false },
      }) as ReturnType<typeof mockStore>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render password input when continue button is clicked and navigate to default route', async () => {
    const { queryByTestId } = renderWithProvider(
      <RestoreVaultPage />,
      mockStore({
        metamask: { currentLocale: 'en' },
        appState: { isLoading: false },
      }) as ReturnType<typeof mockStore>,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    (srpNote as HTMLElement).focus();

    await userEvent.paste(TEST_SEED);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton as HTMLElement);

    expect(queryByTestId('create-password')).toBeInTheDocument();
  });

  it('should call handleImport when password is submitted', async () => {
    const mockCreateNewVaultAndRestore = jest.fn().mockResolvedValue(undefined);
    const mockSetFirstTimeFlowType = jest.fn().mockResolvedValue(undefined);
    const mockResetWallet = jest.fn().mockResolvedValue(undefined);

    const testStore = mockStore({
      metamask: { currentLocale: 'en' },
      appState: { isLoading: false },
    });

    jest.mocked(actions.createNewVaultAndRestore).mockImplementation(((
      password: string,
      seed: string,
    ) => {
      return () => {
        mockCreateNewVaultAndRestore(password, seed);
        return Promise.resolve();
      };
    }) as typeof actions.createNewVaultAndRestore);
    jest.mocked(actions.setFirstTimeFlowType).mockImplementation(((type) => {
      return () => {
        mockSetFirstTimeFlowType(type);
        return Promise.resolve();
      };
    }) as typeof actions.setFirstTimeFlowType);
    jest.mocked(actions.resetWallet).mockImplementation(((
      restoreOnly?: boolean,
    ) => {
      return () => {
        mockResetWallet(restoreOnly);
        return Promise.resolve();
      };
    }) as typeof actions.resetWallet);

    const { queryByTestId } = renderWithProvider(
      <RestoreVaultPage />,
      testStore,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    (srpNote as HTMLElement).focus();

    await userEvent.paste(TEST_SEED);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton as HTMLElement);

    // Wait for the password form to appear
    await waitFor(() => {
      expect(queryByTestId('create-password')).toBeInTheDocument();
    });

    const createPasswordInput = queryByTestId('create-password-new-input');
    const confirmPasswordInput = queryByTestId('create-password-confirm-input');

    expect(createPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();

    const password = '12345678';

    const createPasswordEvent = {
      target: {
        value: password,
      },
    };
    const confirmPasswordEvent = {
      target: {
        value: password,
      },
    };

    fireEvent.change(createPasswordInput as HTMLElement, createPasswordEvent);
    fireEvent.change(confirmPasswordInput as HTMLElement, confirmPasswordEvent);

    const terms = queryByTestId('create-password-terms');
    fireEvent.click(terms as HTMLElement);

    const createPasswordForm = queryByTestId('create-password');
    const createNewWalletButton = queryByTestId('create-password-submit');

    // Wait for the button to be enabled (password validation is async)
    await waitFor(() => {
      expect(createNewWalletButton).not.toBeDisabled();
    });

    // Submit the form directly
    fireEvent.submit(createPasswordForm as HTMLElement);

    // Wait for the async action to be called
    await waitFor(() => {
      const restoreOnly = true;
      expect(mockResetWallet).toHaveBeenCalledWith(restoreOnly);
      expect(mockCreateNewVaultAndRestore).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateNewVaultAndRestore).toHaveBeenCalledWith(
      password,
      TEST_SEED,
    );

    // Verify navigation to default route
    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });
});
