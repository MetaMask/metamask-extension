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

const renderHome = () => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isUnlocked: true,
      completedOnboarding: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const HomeContainer = require('./home.container').default;
  return renderWithProvider(<HomeContainer />, store);
};

describe('HomeWithRouter', () => {
  it('renders AppHeader and DappConnectionControlBar', () => {
    const { getByTestId } = renderHome();
    expect(getByTestId('mock-app-header')).toBeInTheDocument();
    expect(getByTestId('dapp-control-bar-bottom')).toBeInTheDocument();
  });

  it('renders DappConnectionControlBar after Home content', () => {
    const { getByTestId } = renderHome();
    const home = getByTestId('mock-home');
    const bar = getByTestId('dapp-control-bar-bottom');
    const position = home.compareDocumentPosition(bar);
    expect(position).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
