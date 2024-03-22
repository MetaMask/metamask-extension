import React from 'react';
import { screen } from '@testing-library/react';
import { SimulationData } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import mockState from '../../../../test/data/mock-state.json';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { SimulationPreview } from './simulation-preview';

const DUMMY_BALANCE_CHANGE = {
  previousBalance: '0xIGNORED' as Hex,
  newBalance: '0xIGNORED' as Hex,
};

const ONE_ETH = Numeric.from('0xde0b6b3a7640000', 16, EtherDenomination.ETH);
const HALF_ETH = ONE_ETH.divide(2, 16);

describe('SimulationPreview', () => {
  const store = configureStore()(mockState);

  it('renders the component with balance changes', () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: {
        ...DUMMY_BALANCE_CHANGE,
        isDecrease: true,
        difference: ONE_ETH.toPrefixedHexString() as Hex,
      },
      tokenBalanceChanges: [],
    };

    renderWithProvider(
      <SimulationPreview simulationData={simulationData} />,
      store,
    );

    expect(screen.getByText('You send')).toBeInTheDocument();
    expect(screen.getByText('- 1')).toBeInTheDocument();
    expect(screen.getByText('$556.12')).toBeInTheDocument();

    expect(screen.getByAltText('ETH logo')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('renders the component without balance changes', () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: undefined,
      tokenBalanceChanges: [],
    };

    renderWithProvider(
      <SimulationPreview simulationData={simulationData} />,
      store,
    );

    expect(screen.getByText(/No changes predicted/u)).toBeInTheDocument();
    expect(screen.queryByText('You send')).not.toBeInTheDocument();
    expect(screen.queryByText('You receive')).not.toBeInTheDocument();
  });

  it('renders the component with a positive balance change', () => {
    const simulationData: SimulationData = {
      nativeBalanceChange: {
        ...DUMMY_BALANCE_CHANGE,
        isDecrease: false,
        difference: HALF_ETH.toPrefixedHexString() as Hex,
      },
      tokenBalanceChanges: [],
    };

    renderWithProvider(
      <SimulationPreview simulationData={simulationData} />,
      store,
    );

    expect(screen.getByText('You receive')).toBeInTheDocument();
    expect(screen.getByText('+ 0.5')).toBeInTheDocument();
    expect(screen.getByText('$278.06')).toBeInTheDocument();
  });

  it('renders the error message when simulation fails', () => {
    renderWithProvider(<SimulationPreview simulationData={undefined} />, store);

    expect(screen.getByText(/There was an error/u)).toBeInTheDocument();
  });
});
