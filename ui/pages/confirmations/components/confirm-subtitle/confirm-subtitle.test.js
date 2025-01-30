import React from 'react';
import { ERC1155, ERC721 } from '@metamask/controller-utils';

import { CHAIN_IDS } from '@metamask/transaction-controller';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { getSelectedInternalAccountFromMockState } from '../../../../../test/jest/mocks';
import ConfirmSubTitle from './confirm-subtitle';

const mockSelectedInternalAccount =
  getSelectedInternalAccountFromMockState(mockState);

describe('ConfirmSubTitle', () => {
  let store;
  beforeEach(() => {
    mockState.metamask.preferences.showFiatInTestnets = true;
    store = configureStore(mockState);
  });

  it('should render subtitle correctly', async () => {
    const { findByText } = renderWithProvider(
      <ConfirmSubTitle
        txData={{
          txParams: {},
        }}
        hexTransactionAmount="0x9184e72a000"
      />,
      store,
    );
    expect(await findByText('$0.01')).toBeInTheDocument();
  });

  it('should return null if showFiatInTestnets preference if false', () => {
    mockState.metamask.preferences.showFiatInTestnets = false;
    store = configureStore(mockState);

    const { container } = renderWithProvider(
      <ConfirmSubTitle
        txData={{
          txParams: {},
        }}
        hexTransactionAmount="0x9184e72a000"
      />,
      store,
    );
    expect(container.firstChild).toStrictEqual(null);
  });

  it('should not return null if it is NFT Transfer', async () => {
    mockState.metamask.preferences.showFiatInTestnets = false;
    mockState.metamask.allNftContracts = {
      [mockSelectedInternalAccount.address]: {
        [CHAIN_IDS.GOERLI]: [{ address: '0x9' }],
      },
    };
    store = configureStore(mockState);

    const { findByText } = renderWithProvider(
      <ConfirmSubTitle
        txData={{
          chainId: CHAIN_IDS.GOERLI,
          txParams: {
            to: '0x9',
          },
        }}
        hexTransactionAmount="0x9184e72a000"
      />,
      store,
    );
    expect(await findByText('0.00001')).toBeInTheDocument();
  });

  it('should not return null if assetStandard is ERC1155', async () => {
    mockState.metamask.preferences.showFiatInTestnets = false;
    store = configureStore(mockState);

    const { findByText } = renderWithProvider(
      <ConfirmSubTitle
        txData={{
          txParams: {
            to: '0x9',
          },
        }}
        assetStandard={ERC1155}
        hexTransactionAmount="0x9184e72a000"
      />,
      store,
    );
    expect(await findByText('0.00001')).toBeInTheDocument();
  });

  it('should not return null if assetStandard is ERC712', async () => {
    mockState.metamask.preferences.showFiatInTestnets = false;
    store = configureStore(mockState);

    const { findByText } = renderWithProvider(
      <ConfirmSubTitle
        txData={{
          txParams: {
            to: '0x9',
          },
        }}
        assetStandard={ERC721}
        hexTransactionAmount="0x9184e72a000"
      />,
      store,
    );
    expect(await findByText('0.00001')).toBeInTheDocument();
  });

  it('should render subtitleComponent if passed', () => {
    const { getByText } = renderWithProvider(
      <ConfirmSubTitle
        txData={{
          txParams: {},
        }}
        hexTransactionAmount="0x9184e72a000"
        subtitleComponent={<div>dummy_sub_title_passed</div>}
      />,
      store,
    );
    expect(getByText('dummy_sub_title_passed')).toBeInTheDocument();
  });
});
