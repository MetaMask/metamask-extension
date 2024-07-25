import React from 'react';

import { permitSignatureMsg } from '../../../../../../test/data/confirmations/typed_sign';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';
import MOCK_DATA_TREE from './dataTree.test.mock-data';

import { DataTree } from './dataTree';

const store = configureStore(mockState);

describe('DataTree', () => {
  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <DataTree data={MOCK_DATA_TREE.MAIL} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for permit signature type', () => {
    const { container } = renderWithProvider(
      <DataTree
        data={JSON.parse(permitSignatureMsg.msgParams?.data as string)}
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
    const { container } = renderWithProvider(<DataTree data={data} />, store);
    expect(container).toMatchSnapshot();
  });
});
