import { NameEntry, NameType } from '@metamask/name-controller';
import { NftContract } from '@metamask/assets-controllers';
import { getRemoteTokens } from '../selectors';
import { getNftContractsByAddressOnCurrentChain } from '../selectors/nft';
import { useDisplayName } from './useDisplayName';
import { useNames } from './useName';
import { useFirstPartyContractNames } from './useFirstPartyContractName';
import { useNftCollectionsMetadata } from './useNftCollectionsMetadata';
import { renderHook } from '@testing-library/react-hooks';

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

jest.mock('./useNftCollectionsMetadata', () => ({
  useNftCollectionsMetadata: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getRemoteTokens: jest.fn(),
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
  const getRemoteTokensMock = jest.mocked(getRemoteTokens);
  const useFirstPartyContractNamesMock = jest.mocked(
    useFirstPartyContractNames,
  );
  const getNftContractsByAddressOnCurrentChainMock = jest.mocked(
    getNftContractsByAddressOnCurrentChain,
  );
  const useNftCollectionsMetadataMock = jest.mocked(useNftCollectionsMetadata);

  beforeEach(() => {
    jest.resetAllMocks();

    useNamesMock.mockReturnValue([NO_PETNAME_FOUND_RETURN_VALUE]);
    useFirstPartyContractNamesMock.mockReturnValue([
      NO_FIRST_PARTY_CONTRACT_NAME_FOUND_RETURN_VALUE,
    ]);
    getRemoteTokensMock.mockReturnValue([
      {
        name: NO_CONTRACT_NAME_FOUND_RETURN_VALUE,
      },
    ]);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      NO_WATCHED_NFT_NAME_FOUND_RETURN_VALUE,
    );
    useNftCollectionsMetadataMock.mockReturnValue({});
  });

  it('handles no name found', () => {
    const { result } = renderHook(() => useDisplayName(VALUE_MOCK, TYPE_MOCK));
    expect(result.current).toEqual({
      name: null,
      hasPetname: false,
    });
  });

  it('prioritizes a petname over all else', () => {
    useNamesMock.mockReturnValue([PETNAME_FOUND_RETURN_VALUE]);
    useFirstPartyContractNamesMock.mockReturnValue([
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    ]);
    getRemoteTokensMock.mockReturnValue([
      {
        name: CONTRACT_NAME_MOCK,
      },
    ]);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    const { result } = renderHook(() => useDisplayName(VALUE_MOCK, TYPE_MOCK));

    expect(result.current).toEqual({
      name: NAME_MOCK,
      hasPetname: true,
      contractDisplayName: CONTRACT_NAME_MOCK,
    });
  });

  it('prioritizes a first-party contract name over a contract name and watched NFT name', () => {
    useFirstPartyContractNamesMock.mockReturnValue([
      FIRST_PARTY_CONTRACT_NAME_MOCK,
    ]);
    getRemoteTokensMock.mockReturnValue({
      name: CONTRACT_NAME_MOCK,
    });
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    const { result } = renderHook(() => useDisplayName(VALUE_MOCK, TYPE_MOCK));

    expect(result.current).toEqual({
      name: FIRST_PARTY_CONTRACT_NAME_MOCK,
      hasPetname: false,
    });
  });

  it('prioritizes a contract name over a watched NFT name', () => {
    getRemoteTokensMock.mockReturnValue([
      {
        name: CONTRACT_NAME_MOCK,
      },
    ]);
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    const { result } = renderHook(() => useDisplayName(VALUE_MOCK, TYPE_MOCK));

    expect(result.current).toEqual({
      name: CONTRACT_NAME_MOCK,
      hasPetname: false,
      contractDisplayName: CONTRACT_NAME_MOCK,
    });
  });

  it('returns a watched NFT name if no other name is found', () => {
    getNftContractsByAddressOnCurrentChainMock.mockReturnValue(
      WATCHED_NFT_FOUND_RETURN_VALUE,
    );

    const { result } = renderHook(() => useDisplayName(VALUE_MOCK, TYPE_MOCK));

    expect(result.current).toEqual({
      name: WATCHED_NFT_NAME_MOCK,
      hasPetname: false,
    });
  });

  it('returns nft collection name from metadata if no other name is found', () => {
    const IMAGE_MOCK = 'url';

    useNftCollectionsMetadataMock.mockReturnValue({
      [VALUE_MOCK.toLowerCase()]: {
        name: CONTRACT_NAME_MOCK,
        image: IMAGE_MOCK,
        isSpam: false,
      },
    });

    const { result } = renderHook(() =>
      useDisplayName(VALUE_MOCK, TYPE_MOCK, false),
    );

    expect(result.current).toEqual({
      name: CONTRACT_NAME_MOCK,
      hasPetname: false,
      contractDisplayName: undefined,
      image: IMAGE_MOCK,
    });
  });

  it('does not return nft collection name if collection is marked as spam', () => {
    const IMAGE_MOCK = 'url';

    useNftCollectionsMetadataMock.mockReturnValue({
      [VALUE_MOCK.toLowerCase()]: {
        name: CONTRACT_NAME_MOCK,
        image: IMAGE_MOCK,
        isSpam: true,
      },
    });

    const { result } = renderHook(() =>
      useDisplayName(VALUE_MOCK, TYPE_MOCK, false),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        name: null,
        image: undefined,
      }),
    );
  });
});
