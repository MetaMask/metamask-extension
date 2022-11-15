import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import ViewOnBlockExplorer from '.';

const createProps = (customProps = {}) => {
  return {
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
});
