import React from 'react';

import { renderWithProvider, fireEvent } from '../../../../test/jest';
import ViewOnBlockExplorer from '.';

const createProps = (customProps = {}) => {
  return {
    sensitiveTrackingProperties: {},
    txHash:
      '0x58e5a0fc7fbc849eddc100d44e86276168a8c7baaa5604e44ba6f5eb8ba1b7eb',
    blockExplorerUrl: 'https://etherscan.io',
    ...customProps,
  };
};

describe('ViewOnBlockExplorer', () => {
  it('renders the component with initial props', () => {
    const { container, getByText } = renderWithProvider(
      <ViewOnBlockExplorer {...createProps()} />,
    );
    expect(getByText('View Swap at etherscan.io')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('clicks on the block explorer link', () => {
    global.platform = { openTab: jest.fn() };
    const { getByText } = renderWithProvider(
      <ViewOnBlockExplorer {...createProps()} />,
    );
    const link = getByText('View Swap at etherscan.io');
    expect(link).toBeInTheDocument();
    fireEvent.click(link);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://etherscan.io',
    });
  });
});
