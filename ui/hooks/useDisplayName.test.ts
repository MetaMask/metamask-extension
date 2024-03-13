import { NameEntry, NameType } from '@metamask/name-controller';
import { NftContract } from '@metamask/assets-controllers';
import { getMemoizedMetadataContractName } from '../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../selectors/nft';
import { useDisplayName } from './useDisplayName';
import { useName } from './useName';
import { useFirstPartyContractName } from './useFirstPartyContractName';

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(),
}));

jest.mock('./useName', () => ({
  useName: jest.fn(),
}));

jest.mock('./useFirstPartyContractName', () => ({
  useFirstPartyContractName: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getMemoizedMetadataContractName: jest.fn(),
  getCurrentChainId: jest.fn(),
}));

jest.mock('../selectors/nft', () => ({
  getNftContractsByAddressOnCurrentChain: jest.fn(),
}));

const VALUE_MOCK = '0xabc123';
const TYPE_MOCK = NameType.ETHEREUM_ADDRESS;
const NAME_MOCK = 'TestName';
const CONTRACT_NAME_MOCK = 'TestContractName';
const FIRST_PARTY_CONTRACT_NAME_MOCK = 'MetaMask Bridge';
const WATCHED_NFT_NAME_MOCK = 'TestWatchedNFTName';

const NO_PETNAME_FOUND_RETURN_VALUE = {
  name: null,
} as NameEntry;
const NO_CONTRACT_NAME_FOUND_RETURN_VALUE = '';
const NO_FIRST_PARTY_CONTRACT_NAME_FOUND_RETURN_VALUE = null;
const NO_WATCHED_NFT_NAME_FOUND_RETURN_VALUE = {};

const PETNAME_FOUND_RETURN_VALUE = {
  name: NAME_MOCK,
} as NameEntry;

const WATCHED_NFT_FOUND_RETURN_VALUE = {
  [VALUE_MOCK]: {
    name: WATCHED_NFT_NAME_MOCK,
  } as NftContract,
};

describe('useDisplayName', () => {
  const useNameMock = jest.mocked(useName);
  const getMemoizedMetadataContractNameMock = jest.mocked(
    getMemoizedMetadataContractName,
  );
  const useFirstPartyContractNameMock = jest.mocked(useFirstPartyContractName);
  const getNftContractsByAddressOnCurrentChainMock = jest.mocked(
    getNftContractsByAddressOnCurrentChain,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useNameMock.mockReturnValue(NO_PETNAME_FOUND_RETURN_VALUE);
    useFirstPartyContractNameMock.mockReturnValue(
      NO_FIRST_PARTY_CONTRACT_NAME_FOUND_RETURN_VALUE,
    );
    getMemoizedMetadataContractNameMock.mockReturnValue(
      NO_CONTRACT_NAME_FOUND_RETURN_VALUE,
    );
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      NO_WATCHED_NFT_NAME_FOUND_RETURN_VALUE,
    );
  });

  it('handles no name found', () => {
    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: null,
      hasPetname: false,
    });
  });

  it('prioritizes a petname over all else', () => {
    useNameMock.mockReturnValue(PETNAME_FOUND_RETURN_VALUE);
    useFirstPartyContractNameMock.mockReturnValue(
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    );
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: NAME_MOCK,
      hasPetname: true,
    });
  });

  it('prioritizes a first-party contract name over a contract name and watched NFT name', () => {
    useFirstPartyContractNameMock.mockReturnValue(
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    );
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: FIRST_PARTY_CONTRACT_NAME_MOCK,
      hasPetname: false,
    });
  });

  it('prioritizes a contract name over a watched NFT name', () => {
    getMemoizedMetadataContractNameMock.mockReturnValue(CONTRACT_NAME_MOCK);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: CONTRACT_NAME_MOCK,
      hasPetname: false,
    });
  });

  it('returns a watched NFT name if no other name is found', () => {
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: WATCHED_NFT_NAME_MOCK,
      hasPetname: false,
    });
  });
});
