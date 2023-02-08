import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import RevealSeedPage from './reveal-seed';

const mockRequestRevealSeedWords = jest.fn().mockResolvedValue();

jest.mock('../../store/actions.ts', () => ({
  requestRevealSeedWords: () => mockRequestRevealSeedWords,
}));

describe('Reveal Seed Page', () => {
  const mockState = {
    history: {
      mostRecentOverviewPage: '/',
    },
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
});
