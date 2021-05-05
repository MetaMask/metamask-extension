import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import ViewOnEtherScanLink from '.';

const createProps = (customProps = {}) => {
  return {
    txHash:
      '0x58e5a0fc7fbc849eddc100d44e86276168a8c7baaa5604e44ba6f5eb8ba1b7eb',
    blockExplorerUrl: 'https://block.explorer',
    isCustomBlockExplorerUrl: false,
    ...customProps,
  };
};

describe('ViewOnEtherScanLink', () => {
  it('renders the component with initial props', () => {
    const { container, getByText } = renderWithProvider(
      <ViewOnEtherScanLink {...createProps()} />,
    );
    expect(getByText('View on Etherscan')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the component with a custom block explorer link', () => {
    const { container, getByText } = renderWithProvider(
      <ViewOnEtherScanLink
        {...createProps({
          blockExplorerUrl: 'https://custom-blockchain.explorer',
          isCustomBlockExplorerUrl: true,
        })}
      />,
    );
    expect(getByText('View at custom-blockchain.explorer')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
