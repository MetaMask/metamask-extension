import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { RecommendedAction } from '@metamask/phishing-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import configureStore from '../../store/store';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import RevealSeedPage from './reveal-seed';

const mockUseParams = jest.fn().mockReturnValue({});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

const mockSuccessfulSrpReveal = (): ((
  dispatch: jest.Mock,
) => Promise<string>) => {
  return (dispatch: jest.Mock) => {
    dispatch({ type: 'MOCK_REQUEST_REVEAL_SEED_WORDS' });
    return Promise.resolve('test srp');
  };
};

const mockUnsuccessfulSrpReveal = (): (() => Promise<never>) => {
  return () => Promise.reject(new Error('bad password'));
};

const mockRequestRevealSeedWords = jest
  .fn()
  .mockImplementation(
    mockSuccessfulSrpReveal as () => (dispatch: jest.Mock) => Promise<string>,
  );
const mockScanUrlForPhishing = jest.fn().mockResolvedValue(null);

const password = 'password';

jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  requestRevealSeedWords: (userPassword: string, keyringId?: string) =>
    mockRequestRevealSeedWords(userPassword, keyringId),
  scanUrlForPhishing: (...args: unknown[]) => mockScanUrlForPhishing(...args),
}));

type NavigateQuizToPasswordScreenArgs = {
  getByText: (id: string | RegExp) => HTMLElement;
  queryByTestId: (id: string) => HTMLElement | null;
  fireEvent: typeof fireEvent;
};

async function navigateQuizToPasswordScreen({
  getByText,
  queryByTestId,
  fireEvent: fireEventFn,
}: NavigateQuizToPasswordScreenArgs) {
  fireEventFn.click(getByText(messages.srpSecurityQuizGetStarted.message));

  // Q1: click the correct-answer button (data-testid avoids i18n/apostrophe issues)
  await waitFor(() => {
    expect(queryByTestId('srp-quiz-right-answer')).toBeInTheDocument();
  });
  fireEventFn.click(queryByTestId('srp-quiz-right-answer') as HTMLElement);
  await waitFor(() => {
    expect(queryByTestId('srp-quiz-continue')).toBeInTheDocument();
  });
  fireEventFn.click(queryByTestId('srp-quiz-continue') as HTMLElement);

  // Q2: click the correct-answer button
  await waitFor(() => {
    expect(queryByTestId('srp-quiz-right-answer')).toBeInTheDocument();
  });
  fireEventFn.click(queryByTestId('srp-quiz-right-answer') as HTMLElement);
  await waitFor(() => {
    expect(queryByTestId('srp-quiz-continue')).toBeInTheDocument();
  });
  fireEventFn.click(queryByTestId('srp-quiz-continue') as HTMLElement);

  await waitFor(() => {
    expect(queryByTestId('input-password')).toBeInTheDocument();
  });
}

function createMockMetaMetricsContext() {
  const mockTrackEvent = jest.fn();
  return {
    context: {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    },
    mockTrackEvent,
  };
}

describe('Reveal Seed Page', () => {
  const mockStore = configureMockStore([thunk])(mockState as object);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({});
  });

  afterEach(() => {
    mockScanUrlForPhishing.mockReset().mockResolvedValue(null);
  });

  it('should match snapshot', async () => {
    const { container } = renderWithProvider(<RevealSeedPage />, mockStore);

    await waitFor(() => {
      expect(mockScanUrlForPhishing).toHaveBeenCalled();
    });

    expect(container).toMatchSnapshot();
  });

  it('shows quiz introduction first', async () => {
    const { getByText } = renderWithProvider(<RevealSeedPage />, mockStore);

    await waitFor(() => {
      expect(mockScanUrlForPhishing).toHaveBeenCalled();
    });

    expect(
      getByText(messages.srpSecurityQuizGetStarted.message),
    ).toBeInTheDocument();
  });

  it('navigates to password screen after completing quiz', async () => {
    const { getByText, queryByTestId } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    expect(queryByTestId('input-password')).toBeInTheDocument();
  });

  it('form submit', async () => {
    const { queryByTestId, getByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password') as HTMLElement, {
      target: { value: password },
    });

    fireEvent.click(getByText(messages.continue.message));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
    });
  });

  it('submits the password form via form submit', async () => {
    const { queryByTestId, getByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password') as HTMLElement, {
      target: { value: password },
    });

    fireEvent.submit(queryByTestId('reveal-seed-password-form') as HTMLElement);

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalledWith(
        password,
        undefined,
      );
    });
  });

  it('shows error when password is wrong', async () => {
    mockRequestRevealSeedWords.mockImplementation(
      mockUnsuccessfulSrpReveal as () => (
        dispatch: jest.Mock,
      ) => Promise<string>,
    );

    const { queryByTestId, getByText, queryByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password') as HTMLElement, {
      target: { value: 'bad password' },
    });

    fireEvent.click(getByText(messages.continue.message));

    await waitFor(() => {
      expect(queryByText('bad password')).toBeInTheDocument();
    });
  });

  it('should show srp after completing quiz and entering password', async () => {
    mockRequestRevealSeedWords.mockImplementationOnce(
      mockSuccessfulSrpReveal as () => (dispatch: jest.Mock) => Promise<string>,
    );
    const store = configureStore(mockState as object);
    const { queryByTestId, getByText } = renderWithProvider(
      <RevealSeedPage />,
      store,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password') as HTMLElement, {
      target: { value: password },
    });

    fireEvent.click(getByText(messages.continue.message));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(getByText(messages.copyToClipboard.message)).toBeInTheDocument();
    });
    expect(queryByTestId('recovery-phrase-chips')).toBeInTheDocument();
  });

  it('emits events when correct password is entered', async () => {
    const store = configureStore(mockState as object);
    mockRequestRevealSeedWords
      .mockImplementationOnce(
        mockUnsuccessfulSrpReveal as () => (
          dispatch: jest.Mock,
        ) => Promise<string>,
      )
      .mockImplementationOnce(
        mockSuccessfulSrpReveal as () => (
          dispatch: jest.Mock,
        ) => Promise<string>,
      );

    const { context: metricsContext, mockTrackEvent } =
      createMockMetaMetricsContext();
    const { queryByTestId, getByText, getByRole } = renderWithProvider(
      <MetaMetricsContext.Provider value={metricsContext}>
        <RevealSeedPage />
      </MetaMetricsContext.Provider>,
      store,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password') as HTMLElement, {
      target: { value: 'bad-password' },
    });

    fireEvent.click(getByText(messages.continue.message));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRequested,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportFailed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
          reason: 'bad password',
        },
      });
    });

    mockTrackEvent.mockClear();

    fireEvent.change(queryByTestId('input-password') as HTMLElement, {
      target: { value: password },
    });

    fireEvent.click(getByText(messages.continue.message));

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRequested,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRevealed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
      expect(getByText(messages.copyToClipboard.message)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });

    mockTrackEvent.mockClear();

    const qrTab = getByRole('tab', {
      name: messages.revealSeedWordsQR.message,
    });
    const textTab = getByRole('tab', {
      name: messages.revealSeedWordsText.message,
    });

    fireEvent.click(qrTab);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewsSrpQR,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });

    // Wait for React to commit the tab switch so the Text tab click triggers onTabClick (Tabs only fires when the selected tab changes)
    await waitFor(() => {
      expect(qrTab).toHaveAttribute('aria-selected', 'true');
    });

    fireEvent.click(textTab);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });

    mockTrackEvent.mockClear();

    const revealPhraseButton = queryByTestId('recovery-phrase-reveal');
    fireEvent.click(revealPhraseButton as HTMLElement);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
    });

    const copyButton = queryByTestId('reveal-seed-copy-button');
    fireEvent.click(copyButton as HTMLElement);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportCopied,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          copy_method: 'clipboard',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpCopiedToClipboard,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          copy_method: 'clipboard',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
    });
  });

  it('should emit event when back button is clicked', async () => {
    const { context: metricsContext, mockTrackEvent } =
      createMockMetaMetricsContext();
    const { getByLabelText } = renderWithProvider(
      <MetaMetricsContext.Provider value={metricsContext}>
        <RevealSeedPage />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const backButton = getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealBackButtonClicked,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          screen: 'QUIZ_INTRODUCTION_SCREEN',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
      });
    });
  });

  describe('dapp scan warning', () => {
    function setupDappScanTest(
      scanResult: {
        recommendedAction: RecommendedAction;
        hostname: string;
      } | null = null,
    ) {
      mockScanUrlForPhishing.mockReset().mockResolvedValue(scanResult);
    }

    it('does not show dapp scan warning when scan returns no result', async () => {
      setupDappScanTest();
      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizToPasswordScreen({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(mockScanUrlForPhishing).toHaveBeenCalled();
      });

      expect(queryByTestId('dapp-scan-warning')).not.toBeInTheDocument();
      expect(queryByTestId('reveal-seed-warning')).toBeInTheDocument();
    });

    it('shows dapp scan warning and hides generic warning when site is malicious', async () => {
      setupDappScanTest({
        recommendedAction: RecommendedAction.Block,
        hostname: 'evil.com',
      });

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizToPasswordScreen({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(queryByTestId('dapp-scan-warning')).toBeInTheDocument();
      });

      expect(queryByTestId('reveal-seed-warning')).not.toBeInTheDocument();
    });

    it('shows acknowledgment checkbox when site is malicious', async () => {
      setupDappScanTest({
        recommendedAction: RecommendedAction.Block,
        hostname: 'evil.com',
      });

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizToPasswordScreen({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(
          queryByTestId('dapp-scan-acknowledge-checkbox'),
        ).toBeInTheDocument();
      });
    });

    it('continue button is disabled until checkbox is acknowledged on malicious site', async () => {
      setupDappScanTest({
        recommendedAction: RecommendedAction.Block,
        hostname: 'evil.com',
      });

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizToPasswordScreen({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(queryByTestId('dapp-scan-warning')).toBeInTheDocument();
      });

      fireEvent.change(queryByTestId('input-password') as HTMLElement, {
        target: { value: password },
      });

      const continueButton = queryByTestId(
        'reveal-seed-password-continue',
      ) as HTMLElement;
      expect(continueButton).toBeDisabled();

      fireEvent.click(
        queryByTestId('dapp-scan-acknowledge-checkbox') as HTMLElement,
      );

      expect(continueButton).toBeEnabled();
    });

    it('fires SrpRevealMaliciousSiteDetected metric only when site is malicious', async () => {
      setupDappScanTest({
        recommendedAction: RecommendedAction.Block,
        hostname: 'evil.com',
      });

      const { context: metricsContext, mockTrackEvent } =
        createMockMetaMetricsContext();

      renderWithProvider(
        <MetaMetricsContext.Provider value={metricsContext}>
          <RevealSeedPage />
        </MetaMetricsContext.Provider>,
        mockStore,
      );

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.SrpRevealMaliciousSiteDetected,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            dapp_host_name: 'evil.com',
          },
        });
      });
    });

    it('does not fire metric event when site is not malicious', async () => {
      setupDappScanTest({
        recommendedAction: RecommendedAction.None,
        hostname: 'safe-site.com',
      });

      const { context: metricsContext, mockTrackEvent } =
        createMockMetaMetricsContext();

      renderWithProvider(
        <MetaMetricsContext.Provider value={metricsContext}>
          <RevealSeedPage />
        </MetaMetricsContext.Provider>,
        mockStore,
      );

      await waitFor(() => {
        expect(mockScanUrlForPhishing).toHaveBeenCalled();
      });

      expect(mockTrackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          event: MetaMetricsEventName.SrpRevealMaliciousSiteDetected,
        }),
      );
    });
  });

  describe('multi-srp', () => {
    it('passes the keyringId to the requestRevealSeedWords action', async () => {
      const keyringId = 'ULID01234567890ABCDEFGHIJKLMN';
      mockUseParams.mockReturnValue({ keyringId });

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizToPasswordScreen({
        getByText,
        queryByTestId,
        fireEvent,
      });

      fireEvent.change(queryByTestId('input-password') as HTMLElement, {
        target: { value: password },
      });

      fireEvent.click(getByText(messages.continue.message));

      await waitFor(() => {
        expect(mockRequestRevealSeedWords).toHaveBeenCalledWith(
          password,
          keyringId,
        );
      });
    });

    it('passes undefined for keyringId if there is no param', async () => {
      mockUseParams.mockReturnValue({});

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizToPasswordScreen({
        getByText,
        queryByTestId,
        fireEvent,
      });

      fireEvent.change(queryByTestId('input-password') as HTMLElement, {
        target: { value: password },
      });

      fireEvent.click(getByText(messages.continue.message));

      await waitFor(() => {
        expect(mockRequestRevealSeedWords).toHaveBeenCalledWith(
          password,
          undefined,
        );
      });
    });
  });
});
