import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import configureStore from '../store/store';
import * as tokenUtils from '../helpers/utils/token-util';
import { ERC1155, ERC20, ERC721 } from '../helpers/constants/common';
import { useAssetDetails } from './useAssetDetails';

const renderUseAssetDetails = ({
  tokenAddress,
  userAddress,
  transactionData,
}) => {
  const mockState = {
    metamask: {
      provider: {
        type: 'test',
        chainId: '0x3',
      },
      tokenList: {},
    },
  };

  const wrapper = ({ children }) => (
    <Provider store={configureStore(mockState)}>{children}</Provider>
  );

  return renderHook(
    () => useAssetDetails(tokenAddress, userAddress, transactionData),
    { wrapper },
  );
};

describe('useAssetDetails', () => {
  let getAssetDetailsStub;
  beforeEach(() => {
    getAssetDetailsStub = jest
      .spyOn(tokenUtils, 'getAssetDetails')
      .mockImplementation(() => Promise.resolve({}));
  });
  it('should return object with tokenSymbol set to and empty string, when getAssetDetails returns and empty object', async () => {
    const toAddress = '000000000000000000000000000000000000dead';
    const tokenAddress = '0x1';

    const transactionData = `0xa9059cbb000000000000000000000000${toAddress}000000000000000000000000000000000000000000000000016345785d8a0000`;

    const { result, waitForNextUpdate } = renderUseAssetDetails({
      tokenAddress,
      userAddress: '0x111',
      transactionData,
    });

    await waitForNextUpdate();

    expect(result.current).toStrictEqual({
      assetAddress: tokenAddress,
      assetName: undefined,
      assetStandard: undefined,
      decimals: undefined,
      toAddress: `0x${toAddress}`,
      tokenAmount: undefined,
      tokenId: undefined,
      tokenImage: undefined,
      tokenSymbol: '',
      tokenValue: undefined,
      userBalance: undefined,
    });
  });

  it('should return object with correct tokenValues for an ERC20 token', async () => {
    const userAddress = '0xf04a5cc80b1e94c69b48f5ee68a08cd2f09a7c3e';
    const tokenAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const toAddress = '000000000000000000000000000000000000dead';
    const transactionData = `0xa9059cbb000000000000000000000000${toAddress}00000000000000000000000000000000000000000000000000000000000001f4`;

    const standard = ERC20;
    const symbol = 'WETH';
    const balance = '1';
    const decimals = 18;

    getAssetDetailsStub.mockImplementation(() =>
      Promise.resolve({
        standard,
        symbol,
        balance,
        decimals,
      }),
    );

    const { result, waitForNextUpdate } = renderUseAssetDetails({
      tokenAddress,
      userAddress,
      transactionData,
    });

    await waitForNextUpdate();

    expect(result.current).toStrictEqual({
      assetAddress: tokenAddress,
      assetName: undefined,
      assetStandard: standard,
      decimals,
      toAddress: `0x${toAddress}`,
      tokenAmount: '0.0000000000000005',
      tokenId: undefined,
      tokenImage: undefined,
      tokenSymbol: symbol,
      tokenValue: undefined,
      userBalance: balance,
    });
  });

  it('should return object with correct tokenValues for an ERC721 token', async () => {
    const tokenAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
    const toAddress = '000000000000000000000000000000000000dead';
    const transactionData = `0x23b872dd000000000000000000000000a544eebe103733f22ef62af556023bc918b73d36000000000000000000000000${toAddress}000000000000000000000000000000000000000000000000000000000000000c`;

    const symbol = 'BAYC';
    const tokenId = '12';
    const name = 'BoredApeYachtClub';
    const image =
      'https://bafybeihw3gvmthmvrenfmcvagtais5tv7r4nmiezgsv7nyknjubxw4lite.ipfs.dweb.link';
    const standard = ERC721;

    getAssetDetailsStub.mockImplementation(() =>
      Promise.resolve({
        standard,
        symbol,
        name,
        tokenId,
        image,
      }),
    );

    const { result, waitForNextUpdate } = renderUseAssetDetails({
      tokenAddress,
      transactionData,
    });

    await waitForNextUpdate();

    expect(result.current).toStrictEqual({
      assetAddress: tokenAddress,
      assetName: name,
      assetStandard: standard,
      decimals: undefined,
      toAddress: `0x${toAddress}`,
      tokenId,
      tokenImage: image,
      tokenSymbol: symbol,
      tokenValue: undefined,
      userBalance: undefined,
      tokenAmount: undefined,
    });
  });

  it('should return object with correct tokenValues for an ERC1155 token', async () => {
    const tokenAddress = '0x76BE3b62873462d2142405439777e971754E8E77';
    const toAddress = '000000000000000000000000000000000000dead';
    const transactionData = `0xf242432a000000000000000000000000a544eebe103733f22ef62af556023bc918b73d36000000000000000000000000000000000000000000000000000000000000dead0000000000000000000000000000000000000000000000000000000000000322000000000000000000000000000000000000000000000000000000000000009c00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000`;

    const tokenId = '121';
    const image =
      'https://bafybeihw3gvmthmvrenfmcvagtais5tv7r4nmiezgsv7nyknjubxw4lite.ipfs.dweb.link';
    const standard = ERC1155;

    getAssetDetailsStub.mockImplementation(() =>
      Promise.resolve({
        standard,
        tokenId,
        image,
      }),
    );

    const { result, waitForNextUpdate } = renderUseAssetDetails({
      tokenAddress,
      transactionData,
    });

    await waitForNextUpdate();

    expect(result.current).toStrictEqual({
      assetAddress: tokenAddress,
      assetName: undefined,
      assetStandard: standard,
      decimals: undefined,
      toAddress: `0x${toAddress}`,
      tokenId: undefined,
      tokenImage: image,
      tokenSymbol: '',
      tokenValue: undefined,
      userBalance: undefined,
      tokenAmount: undefined,
    });
  });
});
