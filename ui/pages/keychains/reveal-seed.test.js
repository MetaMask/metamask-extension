import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import RevealSeedPage from './reveal-seed';

const mockRequestRevealSeedWords = jest
  .fn()
  .mockResolvedValue('test seed words');

const mockShowModal = jest.fn().mockResolvedValue('test seed words');

jest.mock('../../store/actions.js', () => ({
  requestRevealSeedWords: () => mockRequestRevealSeedWords,
  showModal: () => mockShowModal,
}));

describe('Reveal Seed Page', () => {
  const mockState = {
    history: {
      mostRecentOverviewPage: '/',
    },
    metamask: { currentLocale: 'en' },
    appState: { isLoading: false },
  };
  const mockStore = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<RevealSeedPage />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('form submit', () => {
    const { queryByTestId, queryByText } = renderWithProvider(
      <RevealSeedPage />,
      mockStore,
    );

    fireEvent.change(queryByTestId('input-password'), {
      target: { value: 'password' },
    });

    fireEvent.click(queryByText('Next'));

    expect(mockRequestRevealSeedWords).toHaveBeenCalled();
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

    expect(mockRequestRevealSeedWords).toHaveBeenCalled();
    expect(mockShowModal).toHaveBeenCalled();
  });
});
