import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import { setBackgroundConnection } from '../../../../test/jest';
import CollectiblesTab from '.';

const COLLECTIBLES = [
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

const COLLECTIBLES_CONTRACTS = [
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

const collectiblesDropdownState = {
  0x495f947276749ce646f68ac8c248420045cb7b5e: true,
  0xdc7382eb0bc9c352a4cba23c909bda01e0206414: true,
};

const ACCOUNT_1 = '0x123';
const ACCOUNT_2 = '0x456';

const render = ({
  collectibleContracts = [],
  collectibles = [],
  selectedAddress,
  chainId = '0x1',
  collectiblesDetectionNoticeDismissed = false,
  useCollectibleDetection,
  onAddNFT = jest.fn(),
}) => {
  const store = configureStore({
    metamask: {
      allCollectibles: {
        [ACCOUNT_1]: {
          [chainId]: collectibles,
        },
      },
      allCollectibleContracts: {
        [ACCOUNT_1]: {
          [chainId]: collectibleContracts,
        },
      },
      provider: { chainId },
      selectedAddress,
      collectiblesDetectionNoticeDismissed,
      useCollectibleDetection,
      collectiblesDropdownState,
    },
  });
  return renderWithProvider(<CollectiblesTab onAddNFT={onAddNFT} />, store);
};

describe('Collectible Items', () => {
  const detectCollectiblesStub = jest.fn();
  const setCollectiblesDetectionNoticeDismissedStub = jest.fn();
  const getStateStub = jest.fn();
  const checkAndUpdateAllCollectiblesOwnershipStatusStub = jest.fn();
  const updateCollectibleDropDownStateStub = jest.fn();
  setBackgroundConnection({
    setCollectiblesDetectionNoticeDismissed: setCollectiblesDetectionNoticeDismissedStub,
    detectCollectibles: detectCollectiblesStub,
    getState: getStateStub,
    checkAndUpdateAllCollectiblesOwnershipStatus: checkAndUpdateAllCollectiblesOwnershipStatusStub,
    updateCollectibleDropDownState: updateCollectibleDropDownStateStub,
  });
  const historyPushMock = jest.fn();

  jest
    .spyOn(reactRouterDom, 'useHistory')
    .mockImplementation()
    .mockReturnValue({ push: historyPushMock });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Collectibles Detection Notice', () => {
    it('should render the Collectibles Detection Notice when currently selected network is Mainnet and currently selected account has no collectibles', () => {
      render({
        selectedAddress: ACCOUNT_2,
        collectibles: COLLECTIBLES,
      });
      expect(screen.queryByText('New! NFT detection')).toBeInTheDocument();
    });
    it('should not render the Collectibles Detection Notice when currently selected network is Mainnet and currently selected account has collectibles', () => {
      render({
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
      });
      expect(screen.queryByText('New! NFT detection')).not.toBeInTheDocument();
    });
    it('should take user to the experimental settings tab in setings when user clicks "Turn on NFT detection in Settings"', () => {
      render({
        selectedAddress: ACCOUNT_2,
        collectibles: COLLECTIBLES,
      });
      fireEvent.click(screen.queryByText('Turn on NFT detection in Settings'));
      expect(historyPushMock).toHaveBeenCalledTimes(1);
      expect(historyPushMock).toHaveBeenCalledWith(EXPERIMENTAL_ROUTE);
    });
    it('should not render the Collectibles Detection Notice when currently selected network is Mainnet and currently selected account has no collectibles but use collectible autodetection preference is set to true', () => {
      render({
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
        useCollectibleDetection: true,
      });
      expect(screen.queryByText('New! NFT detection')).not.toBeInTheDocument();
    });
    it('should not render the Collectibles Detection Notice when currently selected network is Mainnet and currently selected account has no collectibles but user has dismissed the notice before', () => {
      render({
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
        collectiblesDetectionNoticeDismissed: true,
      });
      expect(screen.queryByText('New! NFT detection')).not.toBeInTheDocument();
    });

    it('should call setCollectibesDetectionNoticeDismissed when users clicks "X"', () => {
      render({
        selectedAddress: ACCOUNT_2,
        collectibles: COLLECTIBLES,
      });
      expect(
        setCollectiblesDetectionNoticeDismissedStub,
      ).not.toHaveBeenCalled();
      fireEvent.click(
        screen.queryByTestId('collectibles-detection-notice-close'),
      );
      expect(setCollectiblesDetectionNoticeDismissedStub).toHaveBeenCalled();
    });
  });

  describe('Collections', () => {
    it('should render the name of the collections and number of collectibles in each collection if current account/chainId combination has collectibles', () => {
      render({
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
        collectibleContracts: COLLECTIBLES_CONTRACTS,
      });
      expect(screen.queryByText('PUNKS (5)')).toBeInTheDocument();
      expect(screen.queryByText('Munks (3)')).toBeInTheDocument();
    });
    it('should not render collections if current account/chainId combination has collectibles', () => {
      render({
        selectedAddress: ACCOUNT_2,
        collectibles: COLLECTIBLES,
        collectibleContracts: COLLECTIBLES_CONTRACTS,
      });
      expect(screen.queryByText('PUNKS (5)')).not.toBeInTheDocument();
      expect(screen.queryByText('Munks (3)')).not.toBeInTheDocument();
    });
  });
  describe('Collectibles options', () => {
    it('should render a link "Refresh list" when some collectibles are present on mainnet and collectible auto-detection preference is set to true, which, when clicked calls methods DetectCollectibles and checkAndUpdateCollectiblesOwnershipStatus', () => {
      render({
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
        useCollectibleDetection: true,
      });
      expect(detectCollectiblesStub).not.toHaveBeenCalled();
      expect(
        checkAndUpdateAllCollectiblesOwnershipStatusStub,
      ).not.toHaveBeenCalled();
      fireEvent.click(screen.queryByText('Refresh list'));
      expect(detectCollectiblesStub).toHaveBeenCalled();
      expect(
        checkAndUpdateAllCollectiblesOwnershipStatusStub,
      ).toHaveBeenCalled();
    });

    it('should render a link "Refresh list" when some collectibles are present on a non-mainnet chain, which, when clicked calls a method checkAndUpdateCollectiblesOwnershipStatus', () => {
      render({
        chainId: '0x4',
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
        useCollectibleDetection: true,
      });
      expect(
        checkAndUpdateAllCollectiblesOwnershipStatusStub,
      ).not.toHaveBeenCalled();
      fireEvent.click(screen.queryByText('Refresh list'));
      expect(
        checkAndUpdateAllCollectiblesOwnershipStatusStub,
      ).toHaveBeenCalled();
    });

    it('should render a link "Enable Autodetect" when some collectibles are present and collectible auto-detection preference is set to false, which, when clicked sends user to the experimental tab of settings', () => {
      render({
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
      });
      expect(historyPushMock).toHaveBeenCalledTimes(0);
      fireEvent.click(screen.queryByText('Enable Autodetect'));
      expect(historyPushMock).toHaveBeenCalledTimes(1);
      expect(historyPushMock).toHaveBeenCalledWith(EXPERIMENTAL_ROUTE);
    });
    it('should render a link "Import NFTs" when some collectibles are present, which, when clicked calls the passed in onAddNFT method', () => {
      const onAddNFTStub = jest.fn();
      render({
        selectedAddress: ACCOUNT_1,
        collectibles: COLLECTIBLES,
        onAddNFT: onAddNFTStub,
      });
      expect(onAddNFTStub).toHaveBeenCalledTimes(0);
      fireEvent.click(screen.queryByText('Import NFTs'));
      expect(onAddNFTStub).toHaveBeenCalledTimes(1);
    });
  });
});
