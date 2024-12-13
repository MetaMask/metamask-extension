import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  DecodingData,
  DecodingDataChangeType,
  DecodingDataStateChanges,
} from '@metamask/signature-controller';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../../test/lib/confirmations/render-helpers';
import { permitSignatureMsg } from '../../../../../../../../../test/data/confirmations/typed_sign';
import PermitSimulation, { getStateChangeToolip } from './decoded-simulation';

const decodingData: DecodingData = {
  stateChanges: [
    {
      assetType: 'ERC20',
      changeType: DecodingDataChangeType.Approve,
      address: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      amount: '1461501637330902918203684832716283019655932542975',
      contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    },
  ],
};

const decodingDataListing: DecodingDataStateChanges = [
  {
    assetType: 'NATIVE',
    changeType: DecodingDataChangeType.Receive,
    address: '',
    amount: '900000000000000000',
    contractAddress: '',
  },
  {
    assetType: 'ERC721',
    changeType: DecodingDataChangeType.Listing,
    address: '',
    amount: '',
    contractAddress: '0xafd4896984CA60d2feF66136e57f958dCe9482d5',
    tokenID: '2101',
  },
];

const decodingDataBidding: DecodingDataStateChanges = [
  {
    assetType: 'ERC721',
    changeType: DecodingDataChangeType.Receive,
    address: '',
    amount: '900000000000000000',
    contractAddress: '',
  },
  {
    assetType: 'Native',
    changeType: DecodingDataChangeType.Bidding,
    address: '',
    amount: '',
    contractAddress: '0xafd4896984CA60d2feF66136e57f958dCe9482d5',
    tokenID: '2101',
  },
];

describe('DecodedSimulation', () => {
  it('renders component correctly', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData,
    });
    const mockStore = configureMockStore([])(state);

    const { findByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(await findByText('Estimated changes')).toBeInTheDocument();
    expect(await findByText('Spending cap')).toBeInTheDocument();
    expect(await findByText('1,461,501,637,3...')).toBeInTheDocument();
  });

  it('renders unavailable message if no state change is returned', async () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
    const mockStore = configureMockStore([])(state);

    const { findByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(await findByText('Estimated changes')).toBeInTheDocument();
    expect(await findByText('Unavailable')).toBeInTheDocument();
  });

  describe('getStateChangeToolip', () => {
    it('return correct tooltip when permit is for listing NFT', async () => {
      const tooltip = getStateChangeToolip(
        decodingDataListing,
        decodingDataListing?.[0],
        (str: string) => str,
      );
      expect(tooltip).toBe('signature_decoding_list_nft_tooltip');
    });
  });

  it('return correct tooltip when permit is for bidding NFT', async () => {
    const tooltip = getStateChangeToolip(
      decodingDataBidding,
      decodingDataBidding?.[0],
      (str: string) => str,
    );
    expect(tooltip).toBe('signature_decoding_bid_nft_tooltip');
  });
});
