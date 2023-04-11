import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { MODAL_OPEN } from '../../store/actionConstants';
import mockState from '../../../test/data/mock-state.json';
import RevealSeedPage from './reveal-seed';

const mockRequestRevealSeedWords = jest
  .fn()
  .mockResolvedValue('test seed words');

const mockShowModal = jest.fn().mockResolvedValue({
  type: MODAL_OPEN,
  payload: { name: 'HOLD_TO_REVEAL_SRP' },
});

jest.mock('../../store/actions.ts', () => ({
  requestRevealSeedWords: () => mockRequestRevealSeedWords,
  showModal: () => mockShowModal,
}));

describe('Reveal Seed Page', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  afterEach(() => {
    mockRequestRevealSeedWords.mockClear();
    mockShowModal.mockClear();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<RevealSeedPage />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('form submit', async () => {
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
      expect(mockShowModal).toHaveBeenCalled();
    });
  });

  it('does not show modal on bad password', async () => {
    const mockRequestPasswordFail = jest.fn().mockRejectedValue();
    jest.mock('../../store/actions.ts', () => ({
      requestRevealSeedWords: () => mockRequestPasswordFail,
      showModal: () => mockShowModal,
    }));
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
});
