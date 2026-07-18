import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { RecommendedAction } from '@metamask/phishing-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
  MetaMetricsEventVerificationMethod,
} from '../../../shared/constants/metametrics';
import configureStore from '../../store/store';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../shared/constants/app';
import RevealSeedPage from './reveal-seed';

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

const mockPasskeyAuthResponse = { id: 'assertion-id', type: 'public-key' };
const mockGeneratePasskeyAuthenticationOptions = jest
  .fn()
  .mockResolvedValue({ challenge: 'challenge' });
const mockRequestRevealSeedWordsWithPasskey = jest
  .fn()
  .mockReturnValue(() => Promise.resolve('test srp'));

const mockGetIsPasskeyRegistered = jest.fn().mockReturnValue(false);
const mockGetIsPasskeyFeatureAvailable = jest.fn().mockReturnValue(false);
const mockGetIsSocialLoginFlow = jest.fn().mockReturnValue(false);
const mockGetIsEnrolledPasskeyIncompatibleWithSidepanel = jest
  .fn()
  .mockReturnValue(false);

const mockStartPasskeyAuthentication = jest
  .fn()
  .mockResolvedValue(mockPasskeyAuthResponse);
const mockCancelPasskeyCeremony = jest.fn();
const mockIsPasskeyCeremonySilentError = jest.fn().mockReturnValue(false);
const mockGetEnvironmentType = jest.fn().mockReturnValue('fullscreen');

const password = 'password';

jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  requestRevealSeedWords: (userPassword: string, keyringId?: string) =>
    mockRequestRevealSeedWords(userPassword, keyringId),
  getSeedPhraseWithPasskey: (
    authenticationResponse: unknown,
    keyringId?: string,
  ) => mockRequestRevealSeedWordsWithPasskey(authenticationResponse, keyringId),
  generatePasskeyAuthenticationOptions: (...args: unknown[]) =>
    mockGeneratePasskeyAuthenticationOptions(...args),
  scanUrlForPhishing: (...args: unknown[]) => mockScanUrlForPhishing(...args),
}));

jest.mock('../../selectors', () => ({
  ...jest.requireActual('../../selectors'),
  getIsPasskeyRegistered: () => mockGetIsPasskeyRegistered(),
  getIsPasskeyFeatureAvailable: () => mockGetIsPasskeyFeatureAvailable(),
  getIsSocialLoginFlow: () => mockGetIsSocialLoginFlow(),
  getIsEnrolledPasskeyIncompatibleWithSidepanel: () =>
    mockGetIsEnrolledPasskeyIncompatibleWithSidepanel(),
}));

jest.mock('../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../shared/lib/passkey'),
  startPasskeyAuthentication: (...args: unknown[]) =>
    mockStartPasskeyAuthentication(...args),
  cancelPasskeyCeremony: (...args: unknown[]) =>
    mockCancelPasskeyCeremony(...args),
  isPasskeyCeremonySilentError: (...args: unknown[]) =>
    mockIsPasskeyCeremonySilentError(...args),
}));

jest.mock('../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../shared/lib/environment-type'),
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

type NavigateQuizToPasswordScreenArgs = {
  getByText: (id: string | RegExp) => HTMLElement;
  queryByTestId: (id: string) => HTMLElement | null;
  fireEvent: typeof fireEvent;
  landingTestId?: string;
};

async function navigateQuizToPasswordScreen({
  getByText,
  queryByTestId,
  fireEvent: fireEventFn,
  landingTestId = 'input-password',
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
    expect(queryByTestId(landingTestId)).toBeInTheDocument();
  });
}

async function navigateQuizForPasskeyReveal({
  getByText,
  queryByTestId,
  fireEvent: fireEventFn,
}: Omit<NavigateQuizToPasswordScreenArgs, 'landingTestId'>) {
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

    const { queryByTestId, getByText, getByRole } = renderWithProvider(
      <RevealSeedPage />,
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
        name: MetaMetricsEventName.SrpRevealStarted,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        name: MetaMetricsEventName.KeyExportRequested,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: MetaMetricsEventVerificationMethod.Password,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        name: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
        sensitiveProperties: {},
      });
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        name: MetaMetricsEventName.KeyExportFailed,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: MetaMetricsEventVerificationMethod.Password,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
          reason: 'bad password',
        },
        sensitiveProperties: {},
      });
    });

    mockTrackEvent.mockClear();

    fireEvent.change(queryByTestId('input-password') as HTMLElement, {
      target: { value: password },
    });

    fireEvent.click(getByText(messages.continue.message));

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        name: MetaMetricsEventName.KeyExportRequested,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: MetaMetricsEventVerificationMethod.Password,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        name: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
        sensitiveProperties: {},
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        name: MetaMetricsEventName.KeyExportRevealed,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: MetaMetricsEventVerificationMethod.Password,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
      expect(getByText(messages.copyToClipboard.message)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
        sensitiveProperties: {},
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
        name: MetaMetricsEventName.SrpViewsSrpQR,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
        sensitiveProperties: {},
      });
    });

    // Wait for React to commit the tab switch so the Text tab click triggers onTabClick (Tabs only fires when the selected tab changes)
    await waitFor(() => {
      expect(qrTab).toHaveAttribute('aria-selected', 'true');
    });

    fireEvent.click(textTab);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        name: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
        },
        sensitiveProperties: {},
      });
    });

    mockTrackEvent.mockClear();

    const revealPhraseButton = queryByTestId('recovery-phrase-reveal');
    fireEvent.click(revealPhraseButton as HTMLElement);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        name: MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
        properties: {
          category: MetaMetricsEventCategory.Onboarding,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
    });

    const copyButton = queryByTestId('reveal-seed-copy-button');
    fireEvent.click(copyButton as HTMLElement);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        name: MetaMetricsEventName.KeyExportCopied,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          copy_method: 'clipboard',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        name: MetaMetricsEventName.SrpCopiedToClipboard,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          copy_method: 'clipboard',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
    });
  });

  it('should emit event when back button is clicked', async () => {
    const { getByLabelText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    const backButton = getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.SrpRevealBackButtonClicked,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          screen: 'QUIZ_INTRODUCTION_SCREEN',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
    });
  });

  describe('malicious site block', () => {
    function setupDappScanTest(
      scanResult: {
        recommendedAction: RecommendedAction;
        hostname: string;
      } | null = null,
    ) {
      mockScanUrlForPhishing.mockReset().mockResolvedValue(scanResult);
    }

    it('shows the generic warning and no block when site is not malicious', async () => {
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

      expect(
        queryByTestId('reveal-seed-malicious-block'),
      ).not.toBeInTheDocument();
      expect(queryByTestId('reveal-seed-warning')).toBeInTheDocument();
      expect(queryByTestId('input-password')).toBeInTheDocument();
    });

    it('shows the v2 block and hides password input when site is malicious', async () => {
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
        landingTestId: 'reveal-seed-malicious-block',
      });

      expect(
        queryByTestId('reveal-seed-malicious-block-heading'),
      ).toHaveTextContent(messages.srpRevealMaliciousBlockHeading.message);
      expect(
        queryByTestId('reveal-seed-malicious-block-body'),
      ).toHaveTextContent(
        messages.srpRevealMaliciousBlockBody.message.replace('$1', 'evil.com'),
      );
      expect(
        queryByTestId('reveal-seed-malicious-block-dismiss'),
      ).toHaveTextContent(messages.srpRevealMaliciousBlockDismiss.message);

      expect(queryByTestId('input-password')).not.toBeInTheDocument();
      expect(
        queryByTestId('reveal-seed-password-continue'),
      ).not.toBeInTheDocument();
      expect(queryByTestId('reveal-seed-warning')).not.toBeInTheDocument();
    });

    it('navigates back when the Got it button is clicked on the block', async () => {
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
        landingTestId: 'reveal-seed-malicious-block',
      });

      fireEvent.click(
        queryByTestId('reveal-seed-malicious-block-dismiss') as HTMLElement,
      );

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.SrpRevealBackButtonClicked,
        properties: {
          category: MetaMetricsEventCategory.Keys,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          key_type: MetaMetricsEventKeyType.Srp,
          screen: 'PASSWORD_PROMPT_SCREEN',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: 0,
        },
        sensitiveProperties: {},
      });
    });

    it('fires SrpRevealMaliciousSiteDetected when site is malicious', async () => {
      setupDappScanTest({
        recommendedAction: RecommendedAction.Block,
        hostname: 'evil.com',
      });

      renderWithProvider(<RevealSeedPage />, mockStore);

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          name: MetaMetricsEventName.SrpRevealMaliciousSiteDetected,
          properties: {
            category: MetaMetricsEventCategory.Keys,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            key_type: MetaMetricsEventKeyType.Srp,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            dapp_host_name: 'evil.com',
          },
          sensitiveProperties: {},
        });
      });
    });

    it('does not fire SrpRevealMaliciousSiteDetected when site is not malicious', async () => {
      setupDappScanTest({
        recommendedAction: RecommendedAction.None,
        hostname: 'safe-site.com',
      });

      renderWithProvider(<RevealSeedPage />, mockStore);

      await waitFor(() => {
        expect(mockScanUrlForPhishing).toHaveBeenCalled();
      });

      expect(mockTrackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.SrpRevealMaliciousSiteDetected,
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

  describe('passkey reveal', () => {
    beforeEach(() => {
      mockGetIsPasskeyRegistered.mockReturnValue(true);
      mockGetIsPasskeyFeatureAvailable.mockReturnValue(true);
      mockGetIsSocialLoginFlow.mockReturnValue(false);
      mockGetIsEnrolledPasskeyIncompatibleWithSidepanel.mockReturnValue(false);
      mockStartPasskeyAuthentication.mockResolvedValue(mockPasskeyAuthResponse);
      mockIsPasskeyCeremonySilentError.mockReturnValue(false);
      mockGetEnvironmentType.mockReturnValue('fullscreen');
      mockRequestRevealSeedWordsWithPasskey.mockReturnValue(() =>
        Promise.resolve('test srp'),
      );
    });

    afterEach(() => {
      mockGetIsPasskeyRegistered.mockReturnValue(false);
      mockGetIsPasskeyFeatureAvailable.mockReturnValue(false);
      mockGetIsSocialLoginFlow.mockReturnValue(false);
      mockGetIsEnrolledPasskeyIncompatibleWithSidepanel.mockReturnValue(false);
      mockStartPasskeyAuthentication.mockResolvedValue(mockPasskeyAuthResponse);
      mockIsPasskeyCeremonySilentError.mockReturnValue(false);
      mockGetEnvironmentType.mockReturnValue('fullscreen');
    });

    it('verifies via passkey and reveals the SRP without a password', async () => {
      const store = configureStore(mockState as object);
      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        store,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(mockRequestRevealSeedWordsWithPasskey).toHaveBeenCalledWith(
          mockPasskeyAuthResponse,
          undefined,
        );
        expect(getByText(messages.copyToClipboard.message)).toBeInTheDocument();
      });
      expect(queryByTestId('recovery-phrase-chips')).toBeInTheDocument();
      expect(mockRequestRevealSeedWords).not.toHaveBeenCalled();
    });

    it('falls back to the password prompt when the passkey ceremony is cancelled', async () => {
      mockStartPasskeyAuthentication.mockRejectedValue(new Error('cancelled'));
      mockIsPasskeyCeremonySilentError.mockReturnValue(true);

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(queryByTestId('input-password')).toBeInTheDocument();
      });
      expect(mockRequestRevealSeedWordsWithPasskey).not.toHaveBeenCalled();
    });

    it('falls back to the password prompt when "Use password" is clicked', async () => {
      // Keep the ceremony pending so the verifying step stays visible.
      mockStartPasskeyAuthentication.mockReturnValue(
        new Promise(() => {
          // never resolves
        }),
      );

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(
          queryByTestId('reveal-seed-verify-passkey-use-password'),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        queryByTestId('reveal-seed-verify-passkey-use-password') as HTMLElement,
      );

      await waitFor(() => {
        expect(queryByTestId('input-password')).toBeInTheDocument();
      });
    });

    it('passes the keyringId to the passkey reveal action', async () => {
      const keyringId = 'ULID01234567890ABCDEFGHIJKLMN';
      mockUseParams.mockReturnValue({ keyringId });
      const store = configureStore(mockState as object);

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        store,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(mockRequestRevealSeedWordsWithPasskey).toHaveBeenCalledWith(
          mockPasskeyAuthResponse,
          keyringId,
        );
      });
    });

    it('falls back to the password prompt when passkey export fails', async () => {
      mockRequestRevealSeedWordsWithPasskey.mockReturnValue(() =>
        Promise.reject(new Error('export failed')),
      );

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(queryByTestId('input-password')).toBeInTheDocument();
      });
      expect(mockRequestRevealSeedWordsWithPasskey).toHaveBeenCalled();
      expect(queryByTestId('recovery-phrase-chips')).not.toBeInTheDocument();
    });

    it('shows the malicious site block instead of passkey verification', async () => {
      mockScanUrlForPhishing.mockReset().mockResolvedValue({
        recommendedAction: RecommendedAction.Block,
        hostname: 'evil.com',
      });

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(
          queryByTestId('reveal-seed-malicious-block'),
        ).toBeInTheDocument();
      });
      expect(
        queryByTestId('reveal-seed-passkey-verifying'),
      ).not.toBeInTheDocument();
      expect(mockRequestRevealSeedWordsWithPasskey).not.toHaveBeenCalled();
    });

    it('does not export the SRP when passkey completes before the phishing scan', async () => {
      let resolveScan:
        | ((value: {
            recommendedAction: RecommendedAction;
            hostname: string;
          }) => void)
        | undefined;
      mockScanUrlForPhishing.mockReset().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveScan = resolve;
          }),
      );
      mockStartPasskeyAuthentication.mockResolvedValue(mockPasskeyAuthResponse);

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(mockStartPasskeyAuthentication).toHaveBeenCalled();
      });
      expect(mockRequestRevealSeedWordsWithPasskey).not.toHaveBeenCalled();

      resolveScan?.({
        recommendedAction: RecommendedAction.Block,
        hostname: 'evil.com',
      });

      await waitFor(() => {
        expect(
          queryByTestId('reveal-seed-malicious-block'),
        ).toBeInTheDocument();
      });
      expect(mockRequestRevealSeedWordsWithPasskey).not.toHaveBeenCalled();
    });

    it('uses the password prompt for social-login wallets even when a passkey is enrolled', async () => {
      mockGetIsSocialLoginFlow.mockReturnValue(true);

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(queryByTestId('input-password')).toBeInTheDocument();
      });
      expect(mockRequestRevealSeedWordsWithPasskey).not.toHaveBeenCalled();
      expect(mockStartPasskeyAuthentication).not.toHaveBeenCalled();
    });

    it('falls back to the password prompt in the side panel when the enrolled passkey is incompatible there', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
      mockGetIsEnrolledPasskeyIncompatibleWithSidepanel.mockReturnValue(true);
      const openExtensionInBrowser = jest.fn();
      globalThis.platform = { openExtensionInBrowser } as never;

      const { queryByTestId, getByText } = renderWithProvider(
        <RevealSeedPage />,
        mockStore,
      );

      await navigateQuizForPasskeyReveal({
        getByText,
        queryByTestId,
        fireEvent,
      });

      await waitFor(() => {
        expect(queryByTestId('input-password')).toBeInTheDocument();
      });
      expect(mockRequestRevealSeedWordsWithPasskey).not.toHaveBeenCalled();
      expect(mockStartPasskeyAuthentication).not.toHaveBeenCalled();
      // No hand-off to a full browser tab; the user verifies with the password
      // in the side panel instead.
      expect(openExtensionInBrowser).not.toHaveBeenCalled();
    });
  });
});
