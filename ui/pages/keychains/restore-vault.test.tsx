import React from 'react';
import sinon from 'sinon';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import * as actions from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  getIsPasskeyFeatureAvailable,
  getIsSocialLoginFlow,
} from '../../selectors';
import RestoreVaultPage from './restore-vault';

const mockTrackEvent = jest.fn();

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
      createEventBuilder,
    }),
  };
});

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../selectors', () => ({
  ...jest.requireActual('../../selectors'),
  getIsPasskeyFeatureAvailable: jest.fn(),
  getIsSocialLoginFlow: jest.fn(),
}));

jest.mock('../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/passkey')>(
    '../../../shared/lib/passkey',
  ),
  isPasskeyPRFSupported: jest.fn().mockResolvedValue(true),
}));

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

async function enterSrpAndContinue(
  queryByTestId: (id: string) => HTMLElement | null,
) {
  const srpNote = queryByTestId('srp-input-import__srp-note');
  expect(srpNote).toBeInTheDocument();

  await act(async () => {
    fireEvent.paste(srpNote as HTMLElement, {
      clipboardData: { getData: () => TEST_SEED },
    });
  });

  const confirmSrpButton = queryByTestId('import-srp-confirm');
  expect(confirmSrpButton).not.toBeDisabled();

  await act(async () => {
    fireEvent.click(confirmSrpButton as HTMLElement);
  });

  await waitFor(() => {
    expect(
      queryByTestId('parent-selector-onboarding-password'),
    ).toBeInTheDocument();
  });
}

describe('Restore vault Component', () => {
  const mockStore = configureMockStore([thunk]);

  beforeEach(() => {
    mockUseNavigate.mockClear();
    jest.mocked(getIsPasskeyFeatureAvailable).mockReturnValue(false);
    jest.mocked(getIsSocialLoginFlow).mockReturnValue(false);
  });

  afterEach(() => {
    sinon.restore();
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

    await enterSrpAndContinue(queryByTestId);
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
      .returns(
        mockUnMarkPasswordForgotten as ReturnType<
          typeof actions.unMarkPasswordForgotten
        >,
      );
    sinon.stub(actions, 'createNewVaultAndRestore').callsFake(((
      pw: string,
      seed: string,
    ) => {
      return () => {
        mockCreateNewVaultAndRestore(pw, seed);
        return Promise.resolve();
      };
    }) as typeof actions.createNewVaultAndRestore);
    sinon.stub(actions, 'setFirstTimeFlowType').callsFake(((type) => {
      return () => {
        mockSetFirstTimeFlowType(type);
        return Promise.resolve();
      };
    }) as typeof actions.setFirstTimeFlowType);
    sinon.stub(actions, 'resetWallet').callsFake(((restoreOnly?: boolean) => {
      return () => {
        mockResetWallet(restoreOnly);
        return Promise.resolve();
      };
    }) as typeof actions.resetWallet);

    const { queryByTestId } = renderWithProvider(
      <RestoreVaultPage />,
      testStore,
    );

    await enterSrpAndContinue(queryByTestId);

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

    const createPasswordForm = queryByTestId(
      'parent-selector-onboarding-password',
    );
    const createNewWalletButton = queryByTestId('create-password-submit');

    // Wait for the button to be enabled (password validation is async)
    await waitFor(() => {
      expect(createNewWalletButton).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.submit(createPasswordForm as HTMLElement);
    });

    // Wait for the async action to be called
    await waitFor(() => {
      const restoreOnly = true;
      expect(mockResetWallet.calledWith(restoreOnly)).toBe(true);
      expect(mockCreateNewVaultAndRestore.calledOnce).toBe(true);
    });

    expect(mockCreateNewVaultAndRestore.calledWith(password, TEST_SEED)).toBe(
      true,
    );

    // Verify navigation to default route
    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });

  it('renders passkey setup inline after restoring when passkeys are available', async () => {
    jest.mocked(getIsPasskeyFeatureAvailable).mockReturnValue(true);

    const mockCreateNewVaultAndRestore = sinon.stub().resolves();
    const mockSetFirstTimeFlowType = sinon.stub().resolves();
    const mockUnMarkPasswordForgotten = sinon.stub().returns({ type: 'MOCK' });
    const mockResetWallet = sinon.stub().resolves();

    const testStore = mockStore({
      metamask: { currentLocale: 'en' },
      appState: { isLoading: false },
    });

    sinon
      .stub(actions, 'unMarkPasswordForgotten')
      .returns(
        mockUnMarkPasswordForgotten as ReturnType<
          typeof actions.unMarkPasswordForgotten
        >,
      );
    sinon.stub(actions, 'createNewVaultAndRestore').callsFake(((
      pw: string,
      seed: string,
    ) => {
      return () => {
        mockCreateNewVaultAndRestore(pw, seed);
        return Promise.resolve();
      };
    }) as typeof actions.createNewVaultAndRestore);
    sinon.stub(actions, 'setFirstTimeFlowType').callsFake(((type) => {
      return () => {
        mockSetFirstTimeFlowType(type);
        return Promise.resolve();
      };
    }) as typeof actions.setFirstTimeFlowType);
    sinon.stub(actions, 'resetWallet').callsFake(((restoreOnly?: boolean) => {
      return () => {
        mockResetWallet(restoreOnly);
        return Promise.resolve();
      };
    }) as typeof actions.resetWallet);

    const messenger = createMockRouteMessenger();
    const { queryByTestId } = renderWithProvider(
      <RestoreVaultPage />,
      testStore,
      '/',
      undefined,
      undefined,
      undefined,
      messenger,
    );

    await enterSrpAndContinue(queryByTestId);

    fireEvent.change(
      queryByTestId('create-password-new-input') as HTMLElement,
      {
        target: { value: '12345678' },
      },
    );
    fireEvent.change(
      queryByTestId('create-password-confirm-input') as HTMLElement,
      {
        target: { value: '12345678' },
      },
    );

    fireEvent.click(queryByTestId('create-password-terms') as HTMLElement);
    await act(async () => {
      fireEvent.submit(
        queryByTestId('parent-selector-onboarding-password') as HTMLElement,
      );
    });

    await waitFor(() => {
      expect(mockCreateNewVaultAndRestore.calledOnce).toBe(true);
    });

    await waitFor(() => {
      expect(queryByTestId('passkey-set-up-button')).toBeInTheDocument();
    });

    expect(mockUseNavigate).not.toHaveBeenCalled();

    fireEvent.click(queryByTestId('passkey-maybe-later-button') as HTMLElement);

    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });
});
