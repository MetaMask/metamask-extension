import React from 'react';
import configureMockStore from 'redux-mock-store';

import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../test/jest/rendering';

import AdvancedGasControls from './advanced-gas-controls.component';

const renderComponent = (props) => {
  const store = configureMockStore([])({
    metamask: { identities: [], provider: {} },
  });
  return renderWithProvider(<AdvancedGasControls {...props} />, store);
};

describe('AdvancedGasControls Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });

  it('should not render maxFee and maxPriorityFee inputs if supportsEIP1559 is false', () => {
    const { queryByText } = renderComponent({ supportsEIP1559: false });
    expect(queryByText('Gas Limit')).toBeInTheDocument();
    expect(queryByText('Gas price')).toBeInTheDocument();
    expect(queryByText('Max fee')).not.toBeInTheDocument();
    expect(queryByText('Max priority fee')).not.toBeInTheDocument();
  });

  it('should render maxFee and maxPriorityFee inputs if supportsEIP1559 is true', () => {
    const { queryByText } = renderComponent({
      gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      supportsEIP1559: true,
    });
    expect(queryByText('Gas price')).not.toBeInTheDocument();
    expect(queryByText('Gas Limit')).toBeInTheDocument();
    expect(queryByText('Max fee')).toBeInTheDocument();
    expect(queryByText('Max priority fee')).toBeInTheDocument();
  });
});
