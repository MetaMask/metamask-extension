import React from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';

import Header from './header';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    confirm: {
      currentConfirmation: {
        msgParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        },
      },
    },
  });

  return renderWithProvider(<Header />, store);
};

describe('Header', () => {
  it('should match snapshot', async () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
  it('contains network name and account name', () => {
    const { getByText } = render();
    expect(getByText('Test Account')).toBeInTheDocument();
    expect(getByText('Chain 5')).toBeInTheDocument();
  });
});
