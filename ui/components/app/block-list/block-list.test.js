import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../../test/jest';
import BlockList from '.';

const createBlocksMockStore = () => {
  return {
    metamask: {
      blocks: [
        {
          number: '0x1',
          hash: '0x2',
          nonce: '0x3',
          gasLimit: '0x4',
          gasUsed: '0x5',
          transactions: ['0x6'],
        },
      ],
    },
  };
};

const middleware = [thunk];

describe('BlockList', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createBlocksMockStore());
    const { getByText } = renderWithProvider(<BlockList />, store);
    expect(getByText('Number: 0x1')).toBeInTheDocument();
    expect(getByText('Hash: 0x2')).toBeInTheDocument();
    expect(getByText('Nonce: 0x3')).toBeInTheDocument();
    expect(getByText('GasLimit: 0x4')).toBeInTheDocument();
    expect(getByText('GasUsed: 0x5')).toBeInTheDocument();
    expect(getByText('Transaction Count: 1')).toBeInTheDocument();
  });
});
