import { TokenStandard } from '../../../shared/constants/transaction';
import { parseStandardTokenTransactionData } from '../../../shared/modules/transaction.utils';
import { getTokenStandardAndDetails } from '../../store/actions';
import { getAssetDetails } from './token-util';

jest.mock('../../../shared/modules/transaction.utils', () => ({
  parseStandardTokenTransactionData: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  getTokenStandardAndDetails: jest.fn(),
}));

describe('getAssetDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return asset details for an erc721 token transaction', async () => {
    const erc721Params = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAddrEss',
      transactionData: '0xTransactionData',
      existingNfts: [
        {
          address: '0xAddrEss',
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
      erc721Params.currentUserAddress,
      erc721Params.tokenAddress,
      erc721Params.transactionData,
      erc721Params.existingNfts,
    );

    // should be called if name is null
    expect(getTokenStandardAndDetails).toHaveBeenCalled();
    expect(result.name).toStrictEqual('myToken');
    expect(result.symbol).toStrictEqual('MTK');
    expect(result.standard).toStrictEqual(TokenStandard.ERC721);
  });

  it('should return asset details for an erc721 token transaction without calling api if name is not null', async () => {
    const erc721ParamsWithName = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAddrEss',
      transactionData: '0xTransactionData',
      existingNfts: [
        {
          address: '0xAddrEss',
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
      erc721ParamsWithName.currentUserAddress,
      erc721ParamsWithName.tokenAddress,
      erc721ParamsWithName.transactionData,
      erc721ParamsWithName.existingNfts,
    );

    // should not be called if name is not null
    expect(getTokenStandardAndDetails).not.toHaveBeenCalled();
    expect(result.name).toStrictEqual('myToken');
    expect(result.symbol).toStrictEqual('MTK');
    expect(result.standard).toStrictEqual(TokenStandard.ERC721);
  });

  it('should return the correct asset details for an erc721 token transaction without calling api if symbol is not null', async () => {
    const erc721ParamsWithName = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAddrEss',
      transactionData: '0xTransactionData',
      existingNfts: [
        {
          address: '0xAddrEss',
          name: null,
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
      erc721ParamsWithName.currentUserAddress,
      erc721ParamsWithName.tokenAddress,
      erc721ParamsWithName.transactionData,
      erc721ParamsWithName.existingNfts,
    );

    // should not be called if name is not null
    expect(getTokenStandardAndDetails).not.toHaveBeenCalled();
    expect(result.name).toStrictEqual(null);
    expect(result.symbol).toStrictEqual('MTK');
    expect(result.standard).toStrictEqual(TokenStandard.ERC721);
  });

  it('should return the correct asset details for an erc20 token transaction', async () => {
    const erc20Params = {
      tokenAddress: '0xAddrEssToken',
      currentUserAddress: '0xAccouNtAddress',
      transactionData: '0xTransactionData',
    };
    parseStandardTokenTransactionData.mockReturnValue({
      args: { to: '0xtoAddRess' },
    });
    getTokenStandardAndDetails.mockReturnValue({
      name: 'myERC20Token',
      symbol: 'MTK',
      standard: TokenStandard.ERC20,
    });
    const result = await getAssetDetails(
      erc20Params.currentUserAddress,
      erc20Params.tokenAddress,
      erc20Params.transactionData,
      erc20Params.existingNfts,
    );

    expect(getTokenStandardAndDetails).toHaveBeenCalled();
    expect(result.name).toStrictEqual('myERC20Token');
    expect(result.symbol).toStrictEqual('MTK');
  });
});
