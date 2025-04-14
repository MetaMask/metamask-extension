import React from 'react';
import { act } from '@testing-library/react';
import { Hex } from '@metamask/utils';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';
import * as EIP7702NetworksInfo from '../../../hooks/useEIP7702Networks';
import { SmartAccountTab } from './smart-account-tab';

jest.mock('../../../hooks/useEIP7702Networks', () => ({
  useEIP7702Networks: () => ({
    network7702List: [
      { chainId: '0x0' },
      { chainId: '0x1', isSupported: true },
      { chainId: '0x2' },
      { chainId: '0x3', isSupported: true },
    ],
    pending: false,
  }),
}));

const ADDRESS_MOCK = Object.values(
  mockState.metamask.internalAccounts.accounts,
)[0].address as Hex;

function renderComponent() {
  return renderWithProvider(
    <SmartAccountTab address={ADDRESS_MOCK} />,
    configureStore(mockState),
  );
}

describe('SmartAccountTab', () => {
  it('renders banner for smart account upgrade', async () => {
    const { getByText } = renderComponent();

    expect(getByText('Switch to smart account')).toBeInTheDocument();
    expect(
      getByText('Same address. Smarter features. Learn more.'),
    ).toBeInTheDocument();
  });

  it('renders list of networks', async () => {
    const { getAllByText } = renderComponent();

    expect(getAllByText('Smart Account')).toHaveLength(2);
    expect(getAllByText('Standard Account')).toHaveLength(2);
  });
});
