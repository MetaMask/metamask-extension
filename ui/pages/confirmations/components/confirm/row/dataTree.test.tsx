import React from 'react';

import {
  orderSignatureMsg,
  permitSignatureMsg,
} from '../../../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';

import { DataTree } from './dataTree';

const CHAIN_ID_MOCK = '0x123';

const mockData = {
  contents: { value: 'Hello, Bob!', type: 'string' },
  from: {
    value: {
      name: { value: 'Cow', type: 'string' },
      wallets: {
        value: [
          {
            value: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            type: 'address',
          },
          {
            value: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
            type: 'address',
          },
        ],
        type: 'address[]',
      },
    },
    type: 'Person',
  },
  to: {
    value: [
      {
        value: {
          name: { value: 'Bob', type: 'string' },
          wallets: {
            value: [
              {
                value: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                type: 'address',
              },
              {
                value: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                type: 'address',
              },
              {
                value: '0xB0B0b0b0b0b0B000000000000000000000000000',
                type: 'address',
              },
            ],
            type: 'address[]',
          },
        },
        type: 'Person',
      },
    ],
    type: 'Person[]',
  },
  attachment: { value: '0x', type: 'bytes' },
};

const store = configureStore(mockState);

describe('DataTree', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <DataTree data={mockData} chainId={CHAIN_ID_MOCK} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for permit signature type', () => {
    const { container } = renderWithProvider(
      <DataTree
        data={JSON.parse(permitSignatureMsg.msgParams?.data as string)}
        chainId={CHAIN_ID_MOCK}
      />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for permit signature type and deadline is -1 (None)', () => {
    const mockPermitData = JSON.parse(
      permitSignatureMsg.msgParams?.data as string,
    );
    mockPermitData.message.deadline = '-1';

    const { container } = renderWithProvider(
      <DataTree data={mockPermitData} chainId={CHAIN_ID_MOCK} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for order signature type', () => {
    const { container } = renderWithProvider(
      <DataTree
        data={JSON.parse(orderSignatureMsg.msgParams?.data as string)}
        chainId={CHAIN_ID_MOCK}
      />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('correctly renders reverse strings', () => {
    const data = {
      'Sign into \u202E EVIL': {
        type: 'string',
        value: 'Sign into \u202E EVIL',
      },
      'A number': { type: 'uint32', value: '1337' },
    };
    const { container } = renderWithProvider(
      <DataTree data={data} chainId={CHAIN_ID_MOCK} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });
});
