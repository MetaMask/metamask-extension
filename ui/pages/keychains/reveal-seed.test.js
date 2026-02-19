import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import configureStore from '../../store/store';
import RevealSeedPage from './reveal-seed';

const mockUseParams = jest.fn().mockReturnValue({});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

const mockSuccessfulSrpReveal = () => {
  return (dispatch) => {
    dispatch({ type: 'MOCK_REQUEST_REVEAL_SEED_WORDS' });
    return Promise.resolve('test srp');
  };
};
const mockUnsuccessfulSrpReveal = () => {
  return () => {
    return Promise.reject(new Error('bad password'));
  };
};
const mockRequestRevealSeedWords = jest
  .fn()
  .mockImplementation(mockSuccessfulSrpReveal);
const password = 'password';

jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  requestRevealSeedWords: (userPassword, keyringId) =>
    mockRequestRevealSeedWords(userPassword, keyringId),
}));

// Quiz answers may use curly apostrophe (') in locale output
const Q1_CORRECT = /Can['\u2019]t help you/u;
const Q2_CORRECT = /You['\u2019]re being scammed/u;

async function navigateQuizToPasswordScreen({
  getByText,
  queryByTestId,
  fireEvent: fireEventFn,
}) {
  fireEventFn.click(getByText('Get started'));

  await waitFor(() => {
    expect(getByText(Q1_CORRECT)).toBeInTheDocument();
  });
  fireEventFn.click(getByText(Q1_CORRECT));
  fireEventFn.click(getByText('Continue'));

  await waitFor(() => {
    expect(getByText(Q2_CORRECT)).toBeInTheDocument();
  });
  fireEventFn.click(getByText(Q2_CORRECT));
  fireEventFn.click(getByText('Continue'));

  await waitFor(() => {
    expect(queryByTestId('input-password')).toBeInTheDocument();
  });
}

describe('Reveal Seed Page', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<RevealSeedPage />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('shows quiz introduction first', () => {
    const { getByText } = renderWithProvider(<RevealSeedPage />, mockStore);

    expect(getByText('Get started')).toBeInTheDocument();
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

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: password },
    });

    fireEvent.click(getByText('Continue'));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
    });
  });

  it('shows error when password is wrong', async () => {
    mockRequestRevealSeedWords.mockImplementation(mockUnsuccessfulSrpReveal);

    const { queryByTestId, getByText, queryByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'bad password' },
    });

    fireEvent.click(getByText('Continue'));

    await waitFor(() => {
      expect(queryByText('bad password')).toBeInTheDocument();
    });
  });

  it('should show srp after completing quiz and entering password', async () => {
    mockRequestRevealSeedWords.mockImplementationOnce(mockSuccessfulSrpReveal);
    const store = configureStore(mockState);
    const { queryByTestId, getByText } = renderWithProvider(
      <RevealSeedPage />,
      store,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: password },
    });

    fireEvent.click(getByText('Continue'));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(getByText('Copy to clipboard')).toBeInTheDocument();
    });
    expect(queryByTestId('recovery-phrase-chips')).toBeInTheDocument();
  });

  it('emits events when correct password is entered', async () => {
    const store = configureStore(mockState);
    mockRequestRevealSeedWords
      .mockImplementationOnce(mockUnsuccessfulSrpReveal)
      .mockImplementationOnce(mockSuccessfulSrpReveal);

    const mockTrackEvent = jest.fn();
    const mockMetaMetricsContext = {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    };
    const { queryByTestId, getByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <RevealSeedPage />
      </MetaMetricsContext.Provider>,
      store,
    );

    await navigateQuizToPasswordScreen({
      getByText,
      queryByTestId,
      fireEvent,
    });

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'bad-password' },
    });

    fireEvent.click(getByText('Continue'));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealStarted,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRequested,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportFailed,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          hd_entropy_index: 0,
          reason: 'bad password',
        },
      });
    });

    mockTrackEvent.mockClear();

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: password },
    });

    fireEvent.click(getByText('Continue'));

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRequested,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(3, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRevealed,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          hd_entropy_index: 0,
        },
      });
      expect(getByText('Copy to clipboard')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });

    mockTrackEvent.mockClear();

    const qrTab = getByText('QR');
    const textTab = getByText('Text');

    fireEvent.click(qrTab);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewsSrpQR,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });

    fireEvent.click(textTab);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });

    mockTrackEvent.mockClear();

    const copyButton = getByText('Copy to clipboard');

    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportCopied,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          copy_method: 'clipboard',
          hd_entropy_index: 0,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpCopiedToClipboard,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          copy_method: 'clipboard',
          hd_entropy_index: 0,
        },
      });
    });
  });

  it('should emit event when back button is clicked', async () => {
    const mockTrackEvent = jest.fn();
    const mockMetaMetricsContext = {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    };
    const { getByLabelText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <RevealSeedPage />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const backButton = getByLabelText('Back');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealBackButtonClicked,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          screen: 'QUIZ_INTRODUCTION_SCREEN',
          hd_entropy_index: 0,
        },
      });
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

      fireEvent.change(queryByTestId('input-password'), {
        target: { value: password },
      });

      fireEvent.click(getByText('Continue'));

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

      fireEvent.change(queryByTestId('input-password'), {
        target: { value: password },
      });

      fireEvent.click(getByText('Continue'));

      await waitFor(() => {
        expect(mockRequestRevealSeedWords).toHaveBeenCalledWith(
          password,
          undefined,
        );
      });
    });
  });
});
