import { ERC20, ERC721 } from '@metamask/controller-utils';
import { ethErrors } from 'eth-rpc-errors';
import watchAssetHandler from './watch-asset';

describe('watchAssetHandler', () => {
  let mockEnd;
  let mockHandleWatchAssetRequest;

  beforeEach(() => {
    mockEnd = jest.fn();
    mockHandleWatchAssetRequest = jest.fn();
  });

  it('should handle valid input for type ERC721 correctly', async () => {
    const req = {
      params: {
        options: {
          address: '0x1234',
          tokenId: 'testTokenId',
        },
        type: ERC721,
      },
      origin: 'testOrigin',
      networkClientId: 'networkClientId1',
    };

    const res = {
      result: false,
    };

    await watchAssetHandler.implementation(req, res, null, mockEnd, {
      handleWatchAssetRequest: mockHandleWatchAssetRequest,
    });

    expect(mockHandleWatchAssetRequest).toHaveBeenCalledWith({
      asset: req.params.options,
      type: req.params.type,
      origin: req.origin,
      networkClientId: req.networkClientId,
    });
    expect(res.result).toStrictEqual(true);
    expect(mockEnd).toHaveBeenCalledWith();
  });

  it('should handle valid input for type ERC20 correctly', async () => {
    const req = {
      params: {
        options: {
          address: '0x1234',
          symbol: 'TEST',
          decimals: 18,
        },
        type: ERC20,
      },
      origin: 'testOrigin',
      networkClientId: 'networkClientId1',
    };

    const res = {
      result: false,
    };

    await watchAssetHandler.implementation(req, res, null, mockEnd, {
      handleWatchAssetRequest: mockHandleWatchAssetRequest,
    });

    expect(mockHandleWatchAssetRequest).toHaveBeenCalledWith({
      asset: req.params.options,
      type: req.params.type,
      origin: req.origin,
      networkClientId: req.networkClientId,
    });
    expect(res.result).toStrictEqual(true);
    expect(mockEnd).toHaveBeenCalledWith();
  });

  it('should throw when type is ERC721 and tokenId type is invalid', async () => {
    const req = {
      params: {
        options: {
          address: '0x1234',
          tokenId: 222,
        },
        type: ERC721,
      },
      origin: 'testOrigin',
    };

    const res = {
      result: false,
    };

    await watchAssetHandler.implementation(req, res, null, mockEnd, {
      handleWatchAssetRequest: mockHandleWatchAssetRequest,
    });

    expect(mockEnd).toHaveBeenCalledWith(
      ethErrors.rpc.invalidParams({
        message: `Expected parameter 'tokenId' to be type 'string'. Received type 'number'`,
      }),
    );
  });
});
