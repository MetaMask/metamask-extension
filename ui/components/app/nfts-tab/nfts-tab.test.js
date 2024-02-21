import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest';
import { SECURITY_ROUTE } from '../../../helpers/constants/routes';
import { setBackgroundConnection } from '../../../store/background-connection';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import NftsTab from '.';

const NFTS = [
  {
    address: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
    tokenId:
      '58076532811975507823669075598676816378162417803895263482849101575514658701313',
    name: 'Punk #4',
    creator: {
      user: {
        username: null,
      },
      profile_img_url: null,
      address: '0x806627172af48bd5b0765d3449a7def80d6576ff',
      config: '',
    },
    description: 'Red Mohawk bam!',
    image:
      'https://lh3.googleusercontent.com/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE',
    standard: 'ERC1155',
  },
  {
    address: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
    tokenId:
      '58076532811975507823669075598676816378162417803895263482849101574415147073537',
    name: 'Punk #3',
    creator: {
      user: {
        username: null,
      },
      profile_img_url: null,
      address: '0x806627172af48bd5b0765d3449a7def80d6576ff',
      config: '',
    },
    description: 'Clown PUNK!!!',
    image:
      'https://lh3.googleusercontent.com/H7VrxaalZv4PF1B8U7ADuc8AfuqTVyzmMEDQ5OXKlx0Tqu5XiwsKYj4j_pAF6wUJjLMQbSN_0n3fuj84lNyRhFW9hyrxqDfY1IiQEQ',
    standard: 'ERC1155',
  },
  {
    address: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
    tokenId:
      '58076532811975507823669075598676816378162417803895263482849101573315635445761',
    name: 'Punk #2',
    creator: {
      user: {
        username: null,
      },
      profile_img_url: null,
      address: '0x806627172af48bd5b0765d3449a7def80d6576ff',
      config: '',
    },
    description: 'Got glasses and black hair!',
    image:
      'https://lh3.googleusercontent.com/CHNTSlKB_Gob-iwTq8jcag6XwBkTqBMLt_vEKeBv18Q4AoPFAEPceqK6mRzkad2s5djx6CT5zbGQwDy81WwtNzViK5dQbG60uAWv',
    standard: 'ERC1155',
  },
  {
    address: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
    tokenId:
      '58076532811975507823669075598676816378162417803895263482849101572216123817985',
    name: 'Punk #1',
    creator: {
      user: {
        username: null,
      },
      profile_img_url: null,
      address: '0x806627172af48bd5b0765d3449a7def80d6576ff',
      config: '',
    },
    image:
      'https://lh3.googleusercontent.com/4jfPi-nQNWCUXD5qVNVWX7LX2UufU_elEJcvICFlsTdcBXv70asnDEOlI8oKECZxlXq1wseeIXMwmP5tLyOUxMKk',
    standard: 'ERC1155',
  },
  {
    address: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
    tokenId:
      '58076532811975507823669075598676816378162417803895263482849101571116612190209',
    name: 'Punk #4651',
    creator: {
      user: {
        username: null,
      },
      profile_img_url: null,
      address: '0x806627172af48bd5b0765d3449a7def80d6576ff',
      config: '',
    },
    image:
      'https://lh3.googleusercontent.com/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE',
    standard: 'ERC1155',
  },
  {
    address: '0xDc7382Eb0Bc9C352A4CbA23c909bDA01e0206414',
    tokenId: '1',
    name: 'MUNK #1',
    description: null,
    image: 'ipfs://QmTSZUNt8AKyDabkyXXXP4oHWDnaVXgNdXoJGEyaYzLbeL',
    standard: 'ERC721',
  },
  {
    address: '0xDc7382Eb0Bc9C352A4CbA23c909bDA01e0206414',
    tokenId: '2',
    name: 'MUNK #2',
    description: null,
    image: 'ipfs://QmTSZUNt8AKyDabkyXXXP4oHWDnaVXgNdXoJGEyaYzLbeL',
    standard: 'ERC721',
  },
  {
    address: '0xDc7382Eb0Bc9C352A4CbA23c909bDA01e0206414',
    tokenId: '3',
    name: 'MUNK #3',
    description: null,
    image: 'ipfs://QmTSZUNt8AKyDabkyXXXP4oHWDnaVXgNdXoJGEyaYzLbeL',
    standard: 'ERC721',
  },
];

const NFTS_CONTRACTS = [
  {
    address: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
    name: 'PUNKS',
    symbol: 'PNKS',
    schemaName: 'ERC1155',
  },
  {
    address: '0xDc7382Eb0Bc9C352A4CbA23c909bDA01e0206414',
    name: 'Munks',
    symbol: 'MNKS',
  },
];

const nftsDropdownState = {
  '0x495f947276749ce646f68ac8c248420045cb7b5e': true,
  '0xdc7382eb0bc9c352a4cba23c909bda01e0206414': true,
};

const ACCOUNT_1 = '0x123';
const ACCOUNT_2 = '0x456';

const render = ({
  nftContracts = [],
  nfts = [],
  selectedAddress,
  chainId = '0x1',
  useNftDetection,
}) => {
  const store = configureStore({
    metamask: {
      allNfts: {
        [ACCOUNT_1]: {
          [chainId]: nfts,
        },
      },
      allNftContracts: {
        [ACCOUNT_1]: {
          [chainId]: nftContracts,
        },
      },
      providerConfig: { chainId, type: NETWORK_TYPES.MAINNET },
      selectedAddress,
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: selectedAddress,
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
      useNftDetection,
      nftsDropdownState,
    },
  });
  return renderWithProvider(<NftsTab />, store);
};

describe('NFT Items', () => {
  const detectNftsStub = jest.fn();
  const getStateStub = jest.fn();
  const checkAndUpdateAllNftsOwnershipStatusStub = jest.fn();
  const updateNftDropDownStateStub = jest.fn();
  setBackgroundConnection({
    detectNfts: detectNftsStub,
    getState: getStateStub,
    checkAndUpdateAllNftsOwnershipStatus:
      checkAndUpdateAllNftsOwnershipStatusStub,
    updateNftDropDownState: updateNftDropDownStateStub,
  });
  const historyPushMock = jest.fn();

  jest
    .spyOn(reactRouterDom, 'useHistory')
    .mockImplementation()
    .mockReturnValue({ push: historyPushMock });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('NFTs Detection Notice', () => {
    it('should render the NFTs Detection Notice when currently selected network is Mainnet and currently selected account has no nfts', () => {
      render({
        selectedAddress: ACCOUNT_2,
        nfts: NFTS,
      });
      expect(screen.queryByText('NFT autodetection')).toBeInTheDocument();
    });
    it('should not render the NFTs Detection Notice when currently selected network is Mainnet and currently selected account has NFTs', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
      });
      expect(screen.queryByText('NFT autodetection')).not.toBeInTheDocument();
    });
    it('should take user to the experimental settings tab in settings when user clicks "Turn on NFT detection in Settings"', () => {
      render({
        selectedAddress: ACCOUNT_2,
        nfts: NFTS,
      });
      fireEvent.click(screen.queryByText('Turn on NFT detection in Settings'));
      expect(historyPushMock).toHaveBeenCalledTimes(1);
      expect(historyPushMock).toHaveBeenCalledWith(
        `${SECURITY_ROUTE}#autodetect-nfts`,
      );
    });
    it('should not render the NFTs Detection Notice when currently selected network is Mainnet and currently selected account has no NFTs but use NFT autodetection preference is set to true', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
        useNftDetection: true,
      });
      expect(screen.queryByText('NFT autodetection')).not.toBeInTheDocument();
    });
    it('should not render the NFTs Detection Notice when currently selected network is Mainnet and currently selected account has no NFTs but user has dismissed the notice before', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
      });
      expect(screen.queryByText('NFT autodetection')).not.toBeInTheDocument();
    });
  });

  describe('Collections', () => {
    it('should render the name of the collections and number of NFTs in each collection if current account/chainId combination has NFTs', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
        nftContracts: NFTS_CONTRACTS,
      });
      expect(screen.queryByText('PUNKS (5)')).toBeInTheDocument();
      expect(screen.queryByText('Munks (3)')).toBeInTheDocument();
    });
    it('should not render collections if current account/chainId combination has NFTs', () => {
      render({
        selectedAddress: ACCOUNT_2,
        nfts: NFTS,
        nftContracts: NFTS_CONTRACTS,
      });
      expect(screen.queryByText('PUNKS (5)')).not.toBeInTheDocument();
      expect(screen.queryByText('Munks (3)')).not.toBeInTheDocument();
    });
  });
  describe('NFTs options', () => {
    it('should render a link "Refresh list" when some NFTs are present on mainnet and NFT auto-detection preference is set to true, which, when clicked calls methods DetectNFTs and checkAndUpdateNftsOwnershipStatus', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
        useNftDetection: true,
      });
      expect(detectNftsStub).not.toHaveBeenCalled();
      expect(checkAndUpdateAllNftsOwnershipStatusStub).not.toHaveBeenCalled();
      fireEvent.click(screen.queryByText('Refresh list'));
      expect(detectNftsStub).toHaveBeenCalled();
      expect(checkAndUpdateAllNftsOwnershipStatusStub).toHaveBeenCalled();
    });

    it('should render a link "Refresh list" when some NFTs are present on a non-mainnet chain, which, when clicked calls a method checkAndUpdateNftsOwnershipStatus', () => {
      render({
        chainId: '0x5',
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
        useNftDetection: true,
      });
      expect(checkAndUpdateAllNftsOwnershipStatusStub).not.toHaveBeenCalled();
      fireEvent.click(screen.queryByText('Refresh list'));
      expect(checkAndUpdateAllNftsOwnershipStatusStub).toHaveBeenCalled();
    });

    it('should render a link "Enable autodetect" when some NFTs are present and NFT auto-detection preference is set to false, which, when clicked sends user to the experimental tab of settings', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
      });
      expect(historyPushMock).toHaveBeenCalledTimes(0);
      fireEvent.click(screen.queryByText('Enable autodetect'));
      expect(historyPushMock).toHaveBeenCalledTimes(1);
      expect(historyPushMock).toHaveBeenCalledWith(SECURITY_ROUTE);
    });
  });

  describe('nft conversion banner', () => {
    it('shows the NFT conversion banner when there are no NFTs', () => {
      const { queryByText } = render({
        selectedAddress: ACCOUNT_1,
        nfts: [],
      });

      expect(queryByText('Learn more about NFTs')).toBeInTheDocument();
    });

    it('does not show the NFT conversion banner when there are NFTs', () => {
      const { queryByText } = render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
      });

      expect(queryByText('Learn more about NFTs')).not.toBeInTheDocument();
    });
  });
});
