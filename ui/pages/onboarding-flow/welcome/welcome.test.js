import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import Welcome from './welcome';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Welcome Page', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      metaMetricsId: '0x00000000',
    },
  };
  const mockStore = configureMockStore()(mockState);

  it('should render', () => {
    const { getByText } = renderWithProvider(<Welcome />, mockStore);

    expect(getByText('Welcome to MetaMask')).toBeInTheDocument();

    expect(getByText('Get started')).toBeInTheDocument();
  });

  it('should show the terms of use popup when the user clicks the "Get started" button', () => {
    const { getByText, getByTestId } = renderWithProvider(
      <Welcome />,
      mockStore,
    );

    const getStartedButton = getByText('Get started');
    fireEvent.click(getStartedButton);

    expect(getByText('Review our Terms of Use')).toBeInTheDocument();

    const agreeButton = getByTestId('terms-of-use-agree-button');
    expect(agreeButton).toBeInTheDocument();
    expect(agreeButton).toBeDisabled();
  });
});
