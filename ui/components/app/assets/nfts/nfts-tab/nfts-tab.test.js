import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import { EthAccountType } from '@metamask/keyring-api';
import configureStore from '../../../../../store/store';
import { renderWithProvider } from '../../../../../../test/jest';
import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';
import { setBackgroundConnection } from '../../../../../store/background-connection';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { ETH_EOA_METHODS } from '../../../../../../shared/constants/eth-methods';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import NftsTab from '.';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

const ETH_BALANCE = '0x16345785d8a0000'; // 0.1 ETH

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
const setUseNftDetectionStub = jest.fn();
const setDisplayNftMediaStub = jest.fn();

const render = ({
  nftContracts = [],
  nfts = [],
  selectedAddress,
  chainId = '0x1',
  useNftDetection,
  balance = ETH_BALANCE,
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
      marketData: {
        [CHAIN_IDS.MAINNET]: {},
        [CHAIN_IDS.GOERLI]: {},
      },
      ...mockNetworkState({ chainId }),
      currencyRates: {},
      accounts: {
        [selectedAddress]: {
          address: selectedAddress,
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          [selectedAddress]: { balance },
        },
      },
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
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
      currentCurrency: 'usd',
      tokenList: {},
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
    setUseNftDetection: setUseNftDetectionStub,
    setOpenSeaEnabled: setDisplayNftMediaStub,
  });
  const historyPushMock = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: historyPushMock });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  describe('NFTs Detection Notice', () => {
    it('should render the NFTs Detection Notice when currently selected network is Mainnet and nft detection is set to false and user has nfts', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
      });
      expect(screen.queryByText('NFT autodetection')).toBeInTheDocument();
    });

    it('should render the NFTs Detection Notice when currently selected network is Mainnet and nft detection is set to false and user has no nfts', async () => {
      render({
        selectedAddress: ACCOUNT_2,
        nfts: NFTS,
        useNftDetection: false,
      });
      expect(screen.queryByText('NFT autodetection')).toBeInTheDocument();
    });
    it('should not render the NFTs Detection Notice when currently selected network is Mainnet and nft detection is ON', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
        useNftDetection: true,
      });
      expect(screen.queryByText('NFT autodetection')).not.toBeInTheDocument();
    });
    it('should turn on nft detection without going to settings when user clicks "Enable NFT Autodetection" and nft detection is set to false', async () => {
      render({
        selectedAddress: ACCOUNT_2,
        nfts: NFTS,
        useNftDetection: false,
      });
      fireEvent.click(screen.queryByText('Enable NFT Autodetection'));
      expect(setUseNftDetectionStub).toHaveBeenCalledTimes(1);
      expect(setDisplayNftMediaStub).toHaveBeenCalledTimes(1);
      expect(setUseNftDetectionStub.mock.calls[0][0]).toStrictEqual(true);
      expect(setDisplayNftMediaStub.mock.calls[0][0]).toStrictEqual(true);
    });
    it('should not render the NFTs Detection Notice when currently selected network is Mainnet and currently selected account has no NFTs but use NFT autodetection preference is set to true', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
        useNftDetection: true,
      });
      expect(screen.queryByText('NFT autodetection')).not.toBeInTheDocument();
    });
    it('should render the NFTs Detection Notice when currently selected network is Mainnet and currently selected account has no NFTs but user has dismissed the notice before', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
      });
      expect(screen.queryByText('NFT autodetection')).toBeInTheDocument();
    });

    it('should not render the NFTs Detection Notice when currently selected network is NOT Mainnet', () => {
      render({
        selectedAddress: ACCOUNT_1,
        nfts: NFTS,
        useNftDetection: false,
        chainId: '0x4',
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

  describe('NFT Tab Ramps Card', () => {
    it('shows the ramp card when user balance is zero', async () => {
      const { queryByText } = render({
        selectedAddress: ACCOUNT_1,
        balance: '0x0',
      });
      // wait for spinner to be removed
      await delay(3000);
      expect(queryByText('Get ETH to buy NFTs')).toBeInTheDocument();
    });

    it('does not show the ramp card when the account has a balance', () => {
      const { queryByText } = render({
        selectedAddress: ACCOUNT_1,
        balance: ETH_BALANCE,
      });
      expect(queryByText('Get ETH to buy NFTs')).not.toBeInTheDocument();
    });
  });
});
