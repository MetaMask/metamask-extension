import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  DecodingDataChangeType,
  DecodingDataStateChanges,
} from '@metamask/signature-controller';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../../test/lib/confirmations/render-helpers';
import {
  permitSignatureMsg,
  signatureMsgPermitRevokeDAI,
} from '../../../../../../../../../test/data/confirmations/typed_sign';
import { enLocale as messages } from '../../../../../../../../../test/lib/i18n-helpers';
import PermitSimulation, {
  getStateChangeType,
  getStateChangeToolip,
  StateChangeType,
} from './decoded-simulation';

const decodingData = {
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

const decodingDataListingERC1155: DecodingDataStateChanges = [
  {
    assetType: 'NATIVE',
    changeType: DecodingDataChangeType.Receive,
    address: '',
    amount: '900000000000000000',
    contractAddress: '',
  },
  {
    assetType: 'ERC1155',
    changeType: DecodingDataChangeType.Listing,
    address: '',
    amount: '',
    contractAddress: '0xafd4896984CA60d2feF66136e57f958dCe9482d5',
    tokenID: '2233',
  },
];

const nftListing: DecodingDataStateChanges = [
  {
    assetType: 'ERC721',
    changeType: DecodingDataChangeType.Listing,
    address: '',
    amount: '',
    contractAddress: '0x922dC160f2ab743312A6bB19DD5152C1D3Ecca33',
    tokenID: '189',
  },
  {
    assetType: 'ERC20',
    changeType: DecodingDataChangeType.Receive,
    address: '',
    amount: '950000000000000000',
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
];

const nftBidding: DecodingDataStateChanges = [
  {
    assetType: 'ERC20',
    changeType: DecodingDataChangeType.Bidding,
    address: '',
    amount: '',
    contractAddress: '0x922dC160f2ab743312A6bB19DD5152C1D3Ecca33',
    tokenID: '189',
  },
  {
    assetType: 'ERC721',
    changeType: DecodingDataChangeType.Receive,
    address: '',
    amount: '950000000000000000',
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
];

const stateChangesApproveDAI: DecodingDataStateChanges = [
  {
    assetType: 'ERC20',
    changeType: DecodingDataChangeType.Approve,
    address: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
    amount: '1461501637330902918203684832716283019655932542975',
    contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
];

const stateChangesRevokeDAI: DecodingDataStateChanges = [
  {
    assetType: 'ERC20',
    changeType: DecodingDataChangeType.Revoke,
    address: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
    amount: '0',
    contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
  },
];

describe('DecodedSimulation', () => {
  it('renders component correctly', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: {
        ...decodingData,
        stateChanges: decodingData.stateChanges
          ? [
              {
                ...decodingData.stateChanges[0],
                amount: '12345',
              },
            ]
          : [],
      },
    });

    const mockStore = configureMockStore([])(state);

    const { findByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      await findByText(messages.estimatedChanges.message),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.permitSimulationChange_approve.message),
    ).toBeInTheDocument();
    expect(await findByText('12,345')).toBeInTheDocument();
  });

  it('renders "Unlimited" UI for very large values', async () => {
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

    expect(
      await findByText(messages.estimatedChanges.message),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.permitSimulationChange_approve.message),
    ).toBeInTheDocument();
    expect(await findByText(messages.unlimited.message)).toBeInTheDocument();
  });

  it('renders "Unlimited" for backwards compatibility approve DAI', () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: {
        stateChanges: stateChangesApproveDAI,
      },
    });
    const mockStore = configureMockStore([])(state);

    const { queryByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      queryByText(messages.permitSimulationChange_approve.message),
    ).toBeTruthy();
    expect(queryByText(messages.unlimited.message)).toBeTruthy();
  });

  it('renders backwards compatibility revoke DAI', () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...signatureMsgPermitRevokeDAI,
      decodingLoading: false,
      decodingData: {
        stateChanges: stateChangesRevokeDAI,
      },
    });
    const mockStore = configureMockStore([])(state);

    const { queryByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(queryByText(messages.gatorPermissionsRevoke.message)).toBeTruthy();
    expect(queryByText(messages.unlimited.message)).toBeNull();
  });

  it('render correctly for ERC712 token', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: { stateChanges: decodingDataListing },
    });
    const mockStore = configureMockStore([])(state);

    const { findByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      await findByText(messages.estimatedChanges.message),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.permitSimulationChange_nft_listing.message),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.permitSimulationChange_listing.message),
    ).toBeInTheDocument();
    expect(await findByText('#2101')).toBeInTheDocument();
  });

  it('render correctly for ERC1155 token', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: { stateChanges: decodingDataListingERC1155 },
    });
    const mockStore = configureMockStore([])(state);

    const { findByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      await findByText(messages.estimatedChanges.message),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.permitSimulationChange_receive.message),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.permitSimulationChange_listing.message),
    ).toBeInTheDocument();
    expect(await findByText('#2233')).toBeInTheDocument();
  });

  it('renders unavailable message if no state change is returned', async () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
    const mockStore = configureMockStore([])(state);

    const { findByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      await findByText(messages.estimatedChanges.message),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.simulationDetailsUnavailable.message),
    ).toBeInTheDocument();
  });

  it('renders label only once if there are multiple state changes of same changeType', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: {
        stateChanges: [
          decodingData.stateChanges[0],
          decodingData.stateChanges[0],
          decodingData.stateChanges[0],
        ],
      },
    });
    const mockStore = configureMockStore([])(state);

    const { findAllByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      await findAllByText(messages.permitSimulationChange_approve.message),
    ).toHaveLength(1);
  });

  it('for NFT permit label for receive should be "Listing price"', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: {
        stateChanges: nftListing,
      },
    });
    const mockStore = configureMockStore([])(state);

    const { findAllByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      await findAllByText(messages.permitSimulationChange_nft_listing.message),
    ).toHaveLength(1);
  });

  describe('getStateChangeToolip', () => {
    it('return correct tooltip when permit is for listing NFT', async () => {
      const tooltip = getStateChangeToolip(
        StateChangeType.NFTListingReceive,
        (str: string) => str,
      );
      expect(tooltip).toBe('signature_decoding_list_nft_tooltip');
    });

    it('return correct tooltip when permit is for bidding NFT', async () => {
      const tooltip = getStateChangeToolip(
        StateChangeType.NFTBiddingReceive,
        (str: string) => str,
      );
      expect(tooltip).toBe('signature_decoding_bid_nft_tooltip');
    });
  });

  describe('getStateChangeType', () => {
    it('return correct state change type for NFT listing receive', async () => {
      const stateChange = getStateChangeType(nftListing, nftListing[1]);
      expect(stateChange).toBe(StateChangeType.NFTListingReceive);
    });

    it('return correct state change type for NFT bidding receive', async () => {
      const stateChange = getStateChangeType(nftBidding, nftBidding[1]);
      expect(stateChange).toBe(StateChangeType.NFTBiddingReceive);
    });
  });

  it('renders label only once if there are multiple state changes of same changeType', async () => {
    const state = getMockTypedSignConfirmStateForRequest({
      ...permitSignatureMsg,
      decodingLoading: false,
      decodingData: {
        stateChanges: [
          decodingData.stateChanges[0],
          decodingData.stateChanges[0],
          decodingData.stateChanges[0],
        ],
      },
    });
    const mockStore = configureMockStore([])(state);

    const { findAllByText } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    expect(
      await findAllByText(messages.permitSimulationChange_approve.message),
    ).toHaveLength(1);
  });
});
