import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';

jest.mock('../../components/multichain/app-header', () => ({
  AppHeader: () => <div data-testid="mock-app-header" />,
}));

jest.mock(
  '../../components/multichain/dapp-connection-control-bar',
  () => ({
    DappConnectionControlBar: ({
      placement,
      onTogglePlacement,
    }: {
      placement: string;
      onTogglePlacement: () => void;
    }) => (
      <div
        data-testid={`dapp-control-bar-${placement}`}
        onClick={onTogglePlacement}
      />
    ),
  }),
);

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

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const HomeContainer = require('./home.container').default;
  return renderWithProvider(<HomeContainer />, store);
};

describe('HomeWithRouter', () => {
  it('renders DappConnectionControlBar at the top by default', () => {
    const { getByTestId, queryByTestId } = renderHome();
    expect(getByTestId('dapp-control-bar-top')).toBeInTheDocument();
    expect(queryByTestId('dapp-control-bar-bottom')).not.toBeInTheDocument();
  });

  it('toggles control bar from top to bottom when onTogglePlacement is called', () => {
    const { getByTestId, queryByTestId } = renderHome();

    fireEvent.click(getByTestId('dapp-control-bar-top'));

    expect(queryByTestId('dapp-control-bar-top')).not.toBeInTheDocument();
    expect(getByTestId('dapp-control-bar-bottom')).toBeInTheDocument();
  });

  it('toggles control bar back to top when onTogglePlacement is called again', () => {
    const { getByTestId } = renderHome();

    fireEvent.click(getByTestId('dapp-control-bar-top'));
    fireEvent.click(getByTestId('dapp-control-bar-bottom'));

    expect(getByTestId('dapp-control-bar-top')).toBeInTheDocument();
  });
});
