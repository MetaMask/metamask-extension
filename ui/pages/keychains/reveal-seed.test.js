import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';
import RevealSeedPage from './reveal-seed';

const mockRequestRevealSeedWords = jest.fn();
const mockShowModal = jest.fn();

jest.mock('../../store/actions.ts', () => ({
  // ...jest.requireActual('../../store/actions.ts'),
  requestRevealSeedWords: () => mockRequestRevealSeedWords,
  showModal: () => mockShowModal,
}));

describe('Reveal Seed Page', () => {
  const mockStore = configureMockStore([thunk])(mockState);

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
    mockRequestRevealSeedWords.mockResolvedValueOnce('test srp');
    const { queryByTestId, queryByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    const nextButton = queryByText('Next');

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'password' },
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(mockShowModal).toHaveBeenCalled();
    });
  });

  it('emits events when correct password is entered', async () => {
    mockRequestRevealSeedWords
      .mockRejectedValueOnce('incorrect password')
      .mockResolvedValueOnce('test srp');

    const mockTrackEvent = jest.fn();
    const { queryByTestId, queryByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <RevealSeedPage />
      </MetaMetricsContext.Provider>,
      mockStore,
    );

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'bad-password' },
    });

    fireEvent.click(queryByText('Next'));

    await waitFor(() => {
      expect(mockRequestRevealSeedWords).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.KEY_EXPORT_REQUESTED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.SRP_REVEAL_NEXT_CLICKED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.KEY_EXPORT_FAILED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
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
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.KEY_EXPORT_REQUESTED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.SRP_REVEAL_NEXT_CLICKED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.KEY_EXPORT_REVEALED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
    });

    mockTrackEvent.mockClear();

    const cancelButton = queryByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.KEY_EXPORT_CANCELED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
      expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
        category: EVENT.CATEGORIES.KEYS,
        event: EVENT_NAMES.SRP_REVEAL_CANCELLED,
        properties: {
          key_type: EVENT.KEY_TYPES.SRP,
        },
      });
    });
  });
});
