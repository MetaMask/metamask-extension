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

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('Restore vault Component', () => {
  const mockStore = configureMockStore([thunk]);

  const props = {
    navigate: jest.fn(),
    location: { pathname: '/restore-vault' },
    params: {},
  };

  beforeEach(() => {
    // Reset mocks before each test
    props.navigate.mockClear();
  });

  it('renders match snapshot', () => {
    const { container } = renderWithProvider(
      <RestoreVaultPage {...props} />,
      mockStore({
        metamask: { currentLocale: 'en' },
        appState: { isLoading: false },
      }),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render password input when continue button is clicked and navigate to default route', async () => {
    const { queryByTestId } = renderWithProvider(
      <RestoreVaultPage {...props} />,
      mockStore({
        metamask: { currentLocale: 'en' },
        appState: { isLoading: false },
      }),
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    srpNote.focus();

    await userEvent.paste(TEST_SEED);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton);

    expect(queryByTestId('create-password')).toBeInTheDocument();
  });

  it('should call handleImport when password is submitted', async () => {
    const mockCreateNewVaultAndRestore = sinon.stub().resolves();
    const mockSetFirstTimeFlowType = sinon.stub().resolves();
    const mockUnMarkPasswordForgotten = sinon.stub().returns({ type: 'MOCK' });

    const testStore = mockStore({
      metamask: { currentLocale: 'en' },
      appState: { isLoading: false },
    });

    // Mock the action creators
    sinon
      .stub(actions, 'unMarkPasswordForgotten')
      .returns(mockUnMarkPasswordForgotten);
    sinon.stub(actions, 'createNewVaultAndRestore').callsFake((pw, seed) => {
      return (_dispatch) => {
        mockCreateNewVaultAndRestore(pw, seed);
        return Promise.resolve();
      };
    });
    sinon.stub(actions, 'setFirstTimeFlowType').callsFake((type) => {
      return (_dispatch) => {
        mockSetFirstTimeFlowType(type);
        return Promise.resolve();
      };
    });

    const { queryByTestId } = renderWithProvider(
      <RestoreVaultPage {...props} />,
      testStore,
    );

    const srpNote = queryByTestId('srp-input-import__srp-note');
    expect(srpNote).toBeInTheDocument();

    srpNote.focus();

    await userEvent.paste(TEST_SEED);

    const confirmSrpButton = queryByTestId('import-srp-confirm');

    expect(confirmSrpButton).not.toBeDisabled();

    fireEvent.click(confirmSrpButton);

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

    fireEvent.change(createPasswordInput, createPasswordEvent);
    fireEvent.change(confirmPasswordInput, confirmPasswordEvent);

    const terms = queryByTestId('create-password-terms');
    fireEvent.click(terms);

    const createPasswordForm = queryByTestId('create-password');
    const createNewWalletButton = queryByTestId('create-password-submit');

    // Wait for the button to be enabled (password validation is async)
    await waitFor(() => {
      expect(createNewWalletButton).not.toBeDisabled();
    });

    // Submit the form directly
    fireEvent.submit(createPasswordForm);

    // Wait for the async action to be called
    await waitFor(() => {
      expect(mockCreateNewVaultAndRestore.calledOnce).toBe(true);
    });

    expect(mockCreateNewVaultAndRestore.calledWith(password, TEST_SEED)).toBe(
      true,
    );

    // Restore the stubs
    actions.unMarkPasswordForgotten.restore();
    actions.createNewVaultAndRestore.restore();
    actions.setFirstTimeFlowType.restore();

    // Verify navigation to default route - component uses navigate, not history.push
    expect(props.navigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });
});
