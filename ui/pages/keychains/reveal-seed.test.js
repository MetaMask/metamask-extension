import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { Modal } from '../../components/app/modals';
import configureStore from '../../store/store';
import RevealSeedPage from './reveal-seed';

const mockRequestRevealSeedWords = jest.fn();
const mockShowModal = jest.fn();

jest.mock('../../store/actions.ts', () => ({
  ...jest.requireActual('../../store/actions.ts'),
  requestRevealSeedWords: () => mockRequestRevealSeedWords,
}));

const mockStateWithModal = {
  ...mockState,
  appState: {
    ...mockState.appState,
    modal: {
      open: true,
      modalState: {
        name: 'HOLD_TO_REVEAL_SRP',
        props: {
          onLongPressed: jest.fn(),
        },
      },
    },
  },
};

describe('Reveal Seed Page', () => {
  const mockStore = configureMockStore([thunk])(mockStateWithModal);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<RevealSeedPage />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('form submit', async () => {
    mockRequestRevealSeedWords.mockResolvedValueOnce('test srp');
    const { queryByTestId, queryByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'password' },
    });

    fireEvent.click(queryByText('Next'));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
    });
  });

  it('shows hold to reveal', async () => {
    mockRequestRevealSeedWords.mockResolvedValueOnce('test srp');
    const { queryByTestId, queryByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'password' },
    });

    fireEvent.click(queryByText('Next'));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
    });
  });

  it('does not show modal on bad password', async () => {
    mockRequestRevealSeedWords.mockRejectedValueOnce('incorrect password');

    const { queryByTestId, queryByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'bad password' },
    });

    fireEvent.click(queryByText('Next'));

    await waitFor(() => {
      expect(mockShowModal).not.toHaveBeenCalled();
    });
  });

  it('should show srp after hold to reveal', async () => {
    // need to use actual store because redux-mock-store does not execute actions
    const store = configureStore(mockState);
    mockRequestRevealSeedWords.mockResolvedValueOnce('test srp');
    const { queryByTestId, queryByText } = renderWithProvider(
      <div>
        <Modal />
        <RevealSeedPage />
      </div>,
      store,
    );

    const nextButton = queryByText('Next');

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'password' },
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(queryByText('Keep your SRP safe')).toBeInTheDocument();
    });
  });

  it('emits events when correct password is entered', async () => {
    const store = configureStore(mockState);
    mockRequestRevealSeedWords
      .mockRejectedValueOnce('incorrect password')
      .mockResolvedValueOnce('test srp');

    const mockTrackEvent = jest.fn();
    const { queryByTestId, queryByText, getByText, queryByLabelText } =
      renderWithProvider(
        <MetaMetricsContext.Provider value={mockTrackEvent}>
          <Modal />
          <RevealSeedPage />
        </MetaMetricsContext.Provider>,
        store,
      );

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'bad-password' },
    });

    fireEvent.click(queryByText('Next'));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRequested,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
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
          reason: undefined,
        },
      });
    });

    mockTrackEvent.mockClear();

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'password' },
    });

    fireEvent.click(queryByText('Next'));

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRequested,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealNextClicked,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportRevealed,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(queryByText('Keep your SRP safe')).toBeInTheDocument();
    });

    const holdButton = getByText('Hold to reveal SRP');
    const circleLocked = queryByLabelText('hold to reveal circle locked');

    fireEvent.pointerDown(holdButton);
    fireEvent.transitionEnd(circleLocked);

    const circleUnlocked = queryByLabelText('hold to reveal circle unlocked');
    fireEvent.animationEnd(circleUnlocked);

    await waitFor(() => {
      expect(holdButton.firstChild).toHaveClass(
        'hold-to-reveal-button__icon-container',
      );
      // tests that the mock srp is now shown.
      expect(getByText('test srp')).toBeInTheDocument();
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpViewSrpText,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });

    mockTrackEvent.mockClear();

    // completed hold click
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
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpCopiedToClipboard,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
          copy_method: 'clipboard',
        },
      });
    });

    const doneButton = getByText('Close');
    fireEvent.click(doneButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealCloseClicked,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });
  });

  it('should emit event when cancel is clicked', async () => {
    mockRequestRevealSeedWords
      .mockRejectedValueOnce('incorrect password')
      .mockResolvedValueOnce('test srp');
    const mockTrackEvent = jest.fn();
    const { queryByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <RevealSeedPage />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    const cancelButton = queryByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.KeyExportCanceled,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealCancelled,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
    });
  });
});
