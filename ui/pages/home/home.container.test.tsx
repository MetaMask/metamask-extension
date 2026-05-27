/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck Dynamic container import uses runtime module resolution.
import React from 'react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';

jest.mock('../../components/multichain/app-header', () => ({
  AppHeader: () => <div data-testid="mock-app-header" />,
}));

jest.mock('../../components/multichain/dapp-connection-control-bar', () => ({
  DappConnectionControlBar: () => <div data-testid="dapp-control-bar-bottom" />,
}));

jest.mock('./home.component', () => {
  const HomeComponent = () => <div data-testid="mock-home" />;
  return HomeComponent;
});

jest.mock('../../contexts/shield/shield-subscription', () => ({
  useShieldSubscriptionContext: () => ({
    evaluateCohortEligibility: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const renderHome = async () => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isUnlocked: true,
      completedOnboarding: true,
    },
  });

  const HomeContainer = (await import('./home.container')).default;
  return renderWithProvider(<HomeContainer />, store);
};

describe('HomeWithRouter', () => {
  it('renders AppHeader and DappConnectionControlBar', async () => {
    const { getByTestId } = await renderHome();
    expect(getByTestId('mock-app-header')).toBeInTheDocument();
    expect(getByTestId('dapp-control-bar-bottom')).toBeInTheDocument();
  });

  it('renders DappConnectionControlBar after Home content', async () => {
    const { getByTestId } = await renderHome();
    const home = getByTestId('mock-home');
    const bar = getByTestId('dapp-control-bar-bottom');
    const position = home.compareDocumentPosition(bar);
    expect(position).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
