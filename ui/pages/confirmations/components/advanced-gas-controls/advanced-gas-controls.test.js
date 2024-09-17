import React from 'react';

import { renderWithProvider } from '../../../../../test/jest/rendering';

import AdvancedGasControls from './advanced-gas-controls.component';

const renderComponent = (props) => {
  return renderWithProvider(<AdvancedGasControls {...props} />);
};

describe('AdvancedGasControls Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });

  it('should render gasLimit and gasPrice inputs', () => {
    const { queryByText } = renderComponent();
    expect(queryByText('Gas limit')).toBeInTheDocument();
    expect(queryByText('Gas price')).toBeInTheDocument();
  });
});
