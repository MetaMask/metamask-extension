import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import configureStore from '../store/store';
import { useAssetDetails } from './useAssetDetails';
import * as tokenUtils from '../helpers/utils/token-util';
import { ERC20, ERC721 } from '../helpers/constants/common';

// jest.mock('react-redux', () => {
//     const actual = jest.requireActual('react-redux');
//     return {
//       ...actual,
//       useSelector: jest.fn(),
//       useDispatch: () => jest.fn(),
//     };
//   });

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
    jest.useFakeTimers();
    getAssetDetailsStub = jest
      .spyOn(tokenUtils, 'getAssetDetails')
      .mockImplementation(() => Promise.resolve({}));
  });
  it('should return object with tokenSymbol set to and empty string, when getAssetDetails returns and empty object', async () => {
    const toAddress = '000000000000000000000000000000000000dead';
    const tokenAddress = '0x1';

    const transactionData = `0xa9059cbb000000000000000000000000${toAddress}000000000000000000000000000000000000000000000000016345785d8a0000`;

    const { result } = await renderUseAssetDetails({
      tokenAddress,
      userAddress: '0x111',
      transactionData,
    });

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

    getAssetDetailsStub.mockImplementation(() =>
      Promise.resolve({
        standard: ERC20,
        symbol: 'WETH',
        balance: '1',
        decimals: 18,
      }),
    );

    const { result } = await renderUseAssetDetails({
      tokenAddress,
      userAddress,
      transactionData,
    });

    expect(result.current).toStrictEqual({
      assetAddress: tokenAddress,
      assetName: undefined,
      assetStandard: ERC20,
      decimals: 18,
      toAddress: `0x${toAddress}`,
      tokenAmount: '0.0000000000000005',
      tokenId: undefined,
      tokenImage: undefined,
      tokenSymbol: 'WETH',
      tokenValue: undefined,
      userBalance: '1',
    });
  });

  it('should return object with correct tokenValues for an ERC721 token', async () => {
    const tokenAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
    const toAddress = '000000000000000000000000000000000000dead';
    const transactionData = `0x23b872dd000000000000000000000000a544eebe103733f22ef62af556023bc918b73d36000000000000000000000000${toAddress}000000000000000000000000000000000000000000000000000000000000000c`;

    getAssetDetailsStub.mockImplementation(() =>
      Promise.resolve({
        standard: ERC721,
        symbol: 'BAYC',
        name: 'BoredApeYachtClub',
        tokenId: '12',
        image:
          'https://bafybeihw3gvmthmvrenfmcvagtais5tv7r4nmiezgsv7nyknjubxw4lite.ipfs.dweb.link',
      }),
    );

    const { result } = await renderUseAssetDetails({
      tokenAddress,
      transactionData,
    });

    expect(result.current).toStrictEqual({
      assetAddress: tokenAddress,
      assetName: 'BoredApeYachtClub',
      assetStandard: ERC721,
      decimals: undefined,
      toAddress: `0x${toAddress}`,
      tokenId: '12',
      tokenImage:
        'https://bafybeihw3gvmthmvrenfmcvagtais5tv7r4nmiezgsv7nyknjubxw4lite.ipfs.dweb.link',
      tokenSymbol: 'BAYC',
      tokenValue: undefined,
      userBalance: undefined,
      tokenAmount: undefined,
    });
  });
});
