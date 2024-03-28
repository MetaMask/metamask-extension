import { NameEntry, NameType } from '@metamask/name-controller';
import { NftContract } from '@metamask/assets-controllers';
import { getMemoizedMetadataContracts } from '../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../selectors/nft';
import { useDisplayName } from './useDisplayName';
import { useNames } from './useName';
import { useFirstPartyContractNames } from './useFirstPartyContractName';

jest.mock('react-redux', () => ({
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

jest.mock('./useName', () => ({
  useNames: jest.fn(),
}));

jest.mock('./useFirstPartyContractName', () => ({
  useFirstPartyContractNames: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getMemoizedMetadataContracts: jest.fn(),
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
const NO_CONTRACT_NAME_FOUND_RETURN_VALUE = undefined;
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
  const useNamesMock = jest.mocked(useNames);
  const getMemoizedMetadataContractsMock = jest.mocked(
    getMemoizedMetadataContracts,
  );
  const useFirstPartyContractNamesMock = jest.mocked(
    useFirstPartyContractNames,
  );
  const getNftContractsByAddressOnCurrentChainMock = jest.mocked(
    getNftContractsByAddressOnCurrentChain,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useNamesMock.mockReturnValue([NO_PETNAME_FOUND_RETURN_VALUE]);
    useFirstPartyContractNamesMock.mockReturnValue([
      NO_FIRST_PARTY_CONTRACT_NAME_FOUND_RETURN_VALUE,
    ]);
    getMemoizedMetadataContractsMock.mockReturnValue([
      {
        name: NO_CONTRACT_NAME_FOUND_RETURN_VALUE,
      },
    ]);
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
    useNamesMock.mockReturnValue([PETNAME_FOUND_RETURN_VALUE]);
    useFirstPartyContractNamesMock.mockReturnValue([
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    ]);
    getMemoizedMetadataContractsMock.mockReturnValue([
      {
        name: CONTRACT_NAME_MOCK,
      },
    ]);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: NAME_MOCK,
      hasPetname: true,
      contractDisplayName: CONTRACT_NAME_MOCK,
    });
  });

  it('prioritizes a first-party contract name over a contract name and watched NFT name', () => {
    useFirstPartyContractNamesMock.mockReturnValue([
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    ]);
    getMemoizedMetadataContractsMock.mockReturnValue({
      name: CONTRACT_NAME_MOCK,
    });
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: FIRST_PARTY_CONTRACT_NAME_MOCK,
      hasPetname: false,
    });
  });

  it('prioritizes a contract name over a watched NFT name', () => {
    getMemoizedMetadataContractsMock.mockReturnValue([
      {
        name: CONTRACT_NAME_MOCK,
      },
    ]);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    expect(useDisplayName(VALUE_MOCK, TYPE_MOCK)).toEqual({
      name: CONTRACT_NAME_MOCK,
      hasPetname: false,
      contractDisplayName: CONTRACT_NAME_MOCK,
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
