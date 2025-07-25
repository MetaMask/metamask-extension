import { TokenStandard } from '../../../shared/constants/transaction';
import { parseStandardTokenTransactionData } from '../../../shared/modules/transaction.utils';
import {
  getTokenStandardAndDetails,
  getTokenStandardAndDetailsByChain,
} from '../../store/actions';
import { getAssetDetails } from './token-util';

jest.mock('../../../shared/modules/transaction.utils', () => ({
  parseStandardTokenTransactionData: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

describe('getAssetDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls getTokenStandardAndDetailsByChain when chainId is passed', async () => {
    const paramsWithChainId = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAccouNtAddress',
      transactionData: '0xTransactionData',
      chainId: '0x1',
    };

    parseStandardTokenTransactionData.mockReturnValue({
      args: { to: '0xtoAddRess' },
    });

    getTokenStandardAndDetailsByChain.mockResolvedValue({
      name: 'myERC20Token',
      symbol: 'MTK',
      standard: TokenStandard.ERC20,
    });

    const result = await getAssetDetails(
      paramsWithChainId.tokenAddress,
      paramsWithChainId.currentUserAddress,
      paramsWithChainId.transactionData,
      [],
      paramsWithChainId.chainId,
    );

    // Verify that getTokenStandardAndDetailsByChain is called with the correct arguments
    expect(getTokenStandardAndDetailsByChain).toHaveBeenCalledWith(
      paramsWithChainId.tokenAddress,
      paramsWithChainId.currentUserAddress,
      undefined, // tokenId is undefined in this case
      paramsWithChainId.chainId,
    );

    // Verify the result
    expect(result.name).toStrictEqual('myERC20Token');
    expect(result.symbol).toStrictEqual('MTK');
    expect(result.standard).toStrictEqual(TokenStandard.ERC20);
  });

  it('calls getTokenStandardAndDetails when chainId is not passed', async () => {
    const paramsWithoutChainId = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAccouNtAddress',
      transactionData: '0xTransactionData',
    };

    parseStandardTokenTransactionData.mockReturnValue({
      args: { to: '0xtoAddRess' },
    });

    getTokenStandardAndDetails.mockResolvedValue({
      name: 'myERC20Token',
      symbol: 'MTK',
      standard: TokenStandard.ERC20,
    });

    const result = await getAssetDetails(
      paramsWithoutChainId.tokenAddress,
      paramsWithoutChainId.currentUserAddress,
      paramsWithoutChainId.transactionData,
      [],
    );

    // Verify that getTokenStandardAndDetails is called with the correct arguments
    expect(getTokenStandardAndDetails).toHaveBeenCalledWith(
      paramsWithoutChainId.tokenAddress,
      paramsWithoutChainId.currentUserAddress,
      undefined, // tokenId is undefined in this case
    );

    // Verify the result
    expect(result.name).toStrictEqual('myERC20Token');
    expect(result.symbol).toStrictEqual('MTK');
    expect(result.standard).toStrictEqual(TokenStandard.ERC20);
  });

  it('throws an error with the token address if token data cannot be parsed', async () => {
    const tokenAddress = '0xAddrEssToken';
    const currentUserAddress = '0xAccouNtAddress';
    const transactionData = '0xTransactionData';

    parseStandardTokenTransactionData.mockReturnValue(undefined);

    await expect(
      getAssetDetails(tokenAddress, currentUserAddress, transactionData, []),
    ).rejects.toThrow(
      `Unable to detect valid token data for token: 0xAddrEssToken`,
    );
  });

  it('returns asset details for an erc721 token transaction', async () => {
    const erc721Params = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAddrEss',
      transactionData: '0xTransactionData',
      existingNfts: [
        {
          address: '0xAddrEssToken',
          name: null,
          standard: 'ERC721',
          tokenId: '1',
          tokenURI: 'tokenURI',
        },
      ],
    };
    parseStandardTokenTransactionData.mockReturnValue({
      args: { id: 1, to: '0xtoAddRess' },
    });
    getTokenStandardAndDetails.mockReturnValue({
      name: 'myToken',
      symbol: 'MTK',
      standard: TokenStandard.ERC721,
    });
    const result = await getAssetDetails(
      erc721Params.tokenAddress,
      erc721Params.currentUserAddress,
      erc721Params.transactionData,
      erc721Params.existingNfts,
    );

    // should be called if name is null
    expect(getTokenStandardAndDetails).toHaveBeenCalled();
    expect(result.name).toStrictEqual('myToken');
    expect(result.symbol).toStrictEqual('MTK');
    expect(result.standard).toStrictEqual(TokenStandard.ERC721);
  });

  it('returns asset details for an erc721 token transaction without calling api if name is not null', async () => {
    const erc721ParamsWithName = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAddrEss',
      transactionData: '0xTransactionData',
      existingNfts: [
        {
          address: '0xAddrEssToken',
          name: 'myToken',
          symbol: 'MTK',
          standard: 'ERC721',
          tokenId: '1',
          tokenURI: 'tokenURI',
        },
      ],
    };
    parseStandardTokenTransactionData.mockReturnValue({
      args: { id: 1, to: '0xtoAddRess' },
    });
    getTokenStandardAndDetails.mockReturnValue({
      name: 'myToken',
      symbol: 'MTK',
      standard: TokenStandard.ERC721,
    });
    const result = await getAssetDetails(
      erc721ParamsWithName.tokenAddress,
      erc721ParamsWithName.currentUserAddress,
      erc721ParamsWithName.transactionData,
      erc721ParamsWithName.existingNfts,
    );

    // should not be called if name is not null
    expect(getTokenStandardAndDetails).not.toHaveBeenCalled();
    expect(result.name).toStrictEqual('myToken');
    expect(result.symbol).toStrictEqual('MTK');
    expect(result.standard).toStrictEqual(TokenStandard.ERC721);
  });
});
