import React from 'react';
import sinon from 'sinon';
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

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('Restore vault Component', () => {
  const mockStore = configureMockStore([thunk]);

  beforeEach(() => {
    mockUseNavigate.mockClear();
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
    const mockCreateNewVaultAndRestore = sinon.stub().resolves();
    const mockSetFirstTimeFlowType = sinon.stub().resolves();
    const mockUnMarkPasswordForgotten = sinon.stub().returns({ type: 'MOCK' });
    const mockResetWallet = sinon.stub().resolves();

    const testStore = mockStore({
      metamask: { currentLocale: 'en' },
      appState: { isLoading: false },
    });

    // Mock the action creators
    sinon
      .stub(actions, 'unMarkPasswordForgotten')
      .returns(mockUnMarkPasswordForgotten as ReturnType<
        typeof actions.unMarkPasswordForgotten
      >);
    sinon
      .stub(actions, 'createNewVaultAndRestore')
      .callsFake(((pw: string, seed: string) => {
        return () => {
          mockCreateNewVaultAndRestore(pw, seed);
          return Promise.resolve();
        };
      }) as typeof actions.createNewVaultAndRestore);
    sinon
      .stub(actions, 'setFirstTimeFlowType')
      .callsFake(((type) => {
        return () => {
          mockSetFirstTimeFlowType(type);
          return Promise.resolve();
        };
      }) as typeof actions.setFirstTimeFlowType);
    sinon
      .stub(actions, 'resetWallet')
      .callsFake(((restoreOnly?: boolean) => {
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
      expect(mockResetWallet.calledWith(restoreOnly)).toBe(true);
      expect(mockCreateNewVaultAndRestore.calledOnce).toBe(true);
    });

    expect(mockCreateNewVaultAndRestore.calledWith(password, TEST_SEED)).toBe(
      true,
    );

    // Restore the stubs
    (actions.unMarkPasswordForgotten as sinon.SinonStub).restore();
    (actions.createNewVaultAndRestore as sinon.SinonStub).restore();
    (actions.setFirstTimeFlowType as sinon.SinonStub).restore();
    (actions.resetWallet as sinon.SinonStub).restore();

    // Verify navigation to default route
    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });
});
