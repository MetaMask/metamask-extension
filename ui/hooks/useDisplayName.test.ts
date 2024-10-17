import { NameType } from '@metamask/name-controller';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { cloneDeep } from 'lodash';
import { Hex } from '@metamask/utils';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import mockState from '../../test/data/mock-state.json';
import {
  EXPERIENCES_TYPE,
  FIRST_PARTY_CONTRACT_NAMES,
} from '../../shared/constants/first-party-contracts';
import { useDisplayName } from './useDisplayName';
import { useNftCollectionsMetadata } from './useNftCollectionsMetadata';
import { useNames } from './useName';

jest.mock('./useName');
jest.mock('./useNftCollectionsMetadata');

const VALUE_MOCK = 'testvalue';
const VARIATION_MOCK = CHAIN_IDS.GOERLI;
const PETNAME_MOCK = 'testName1';
const ERC20_TOKEN_NAME_MOCK = 'testName2';
const WATCHED_NFT_NAME_MOCK = 'testName3';
const NFT_NAME_MOCK = 'testName4';
const FIRST_PARTY_CONTRACT_NAME_MOCK = 'testName5';
const SYMBOL_MOCK = 'tes';
const IMAGE_MOCK = 'testImage';
const OTHER_NAME_TYPE = 'test' as NameType;

describe('useDisplayName', () => {
  const useNamesMock = jest.mocked(useNames);
  const useNftCollectionsMetadataMock = jest.mocked(useNftCollectionsMetadata);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let state: any;

  function mockPetname(name: string) {
    useNamesMock.mockReturnValue([
      {
        name,
        sourceId: null,
        proposedNames: {},
        origin: null,
      },
    ]);
  }

  function mockERC20TokenName(value: string, name: string, symbol: string) {
    state.metamask.tokenList[value] = { name, symbol };
  }

  function mockWatchedNFTName(value: string, variation: string, name: string) {
    state.metamask.allNftContracts = {
      '0x123': {
        [variation]: [{ address: value, name }],
      },
    };
  }

  function mockNFT(
    value: string,
    variation: string,
    name: string,
    image: string,
    isSpam: boolean,
  ) {
    useNftCollectionsMetadataMock.mockReturnValue({
      [variation]: {
        [value]: { name, image, isSpam },
      },
    });
  }

  function mockFirstPartyContractName(
    value: string,
    variation: string,
    name: string,
  ) {
    FIRST_PARTY_CONTRACT_NAMES[name as EXPERIENCES_TYPE] = {
      [variation as Hex]: value as Hex,
    };
  }

  beforeEach(() => {
    jest.resetAllMocks();

    useNftCollectionsMetadataMock.mockReturnValue({});

    useNamesMock.mockReturnValue([
      {
        name: null,
        sourceId: null,
        proposedNames: {},
        origin: null,
      },
    ]);

    state = cloneDeep(mockState);

    delete FIRST_PARTY_CONTRACT_NAMES[
      FIRST_PARTY_CONTRACT_NAME_MOCK as EXPERIENCES_TYPE
    ];
  });

  it('returns no name if no defaults found', () => {
    const { result } = renderHookWithProvider(
      () =>
        useDisplayName({
          value: VALUE_MOCK,
          type: NameType.ETHEREUM_ADDRESS,
          variation: VARIATION_MOCK,
        }),
      mockState,
    );

    expect(result.current).toStrictEqual({
      contractDisplayName: undefined,
      hasPetname: false,
      image: undefined,
      name: null,
    });
  });

  describe('Petname', () => {
    it('returns petname', () => {
      mockPetname(PETNAME_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: true,
        image: undefined,
        name: PETNAME_MOCK,
      });
    });
  });

  describe('ERC-20 Token', () => {
    it('returns ERC-20 token name', () => {
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: ERC20_TOKEN_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        name: ERC20_TOKEN_NAME_MOCK,
      });
    });

    it('returns ERC-20 token symbol', () => {
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: CHAIN_IDS.GOERLI,
            preferContractSymbol: true,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: SYMBOL_MOCK,
        hasPetname: false,
        image: undefined,
        name: SYMBOL_MOCK,
      });
    });

    it('returns no name if type not address', () => {
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: OTHER_NAME_TYPE,
            variation: CHAIN_IDS.GOERLI,
            preferContractSymbol: true,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: null,
      });
    });

    it('returns no name if variation does not match global chain ID', () => {
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: CHAIN_IDS.MAINNET,
            preferContractSymbol: true,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: null,
      });
    });
  });

  describe('First-party Contract', () => {
    it('returns first-party contract name', () => {
      mockFirstPartyContractName(
        VALUE_MOCK,
        VARIATION_MOCK,
        FIRST_PARTY_CONTRACT_NAME_MOCK,
      );

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        mockState,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: FIRST_PARTY_CONTRACT_NAME_MOCK,
      });
    });

    it('returns no name if type is not address', () => {
      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value:
              FIRST_PARTY_CONTRACT_NAMES[EXPERIENCES_TYPE.METAMASK_BRIDGE][
                CHAIN_IDS.OPTIMISM
              ],
            type: OTHER_NAME_TYPE,
            variation: CHAIN_IDS.OPTIMISM,
          }),
        mockState,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: null,
      });
    });
  });

  describe('Watched NFT', () => {
    it('returns watched NFT name', () => {
      mockWatchedNFTName(VALUE_MOCK, VARIATION_MOCK, WATCHED_NFT_NAME_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: WATCHED_NFT_NAME_MOCK,
      });
    });

    it('returns no name if type is not address', () => {
      mockWatchedNFTName(VALUE_MOCK, VARIATION_MOCK, WATCHED_NFT_NAME_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: OTHER_NAME_TYPE,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: null,
      });
    });
  });

  describe('NFT', () => {
    it('returns NFT name and image', () => {
      mockNFT(VALUE_MOCK, VARIATION_MOCK, NFT_NAME_MOCK, IMAGE_MOCK, false);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        mockState,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: IMAGE_MOCK,
        name: NFT_NAME_MOCK,
      });
    });

    it('returns no name if NFT collection is spam', () => {
      mockNFT(VALUE_MOCK, VARIATION_MOCK, NFT_NAME_MOCK, IMAGE_MOCK, true);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        mockState,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: null,
      });
    });

    it('returns no name if type not address', () => {
      mockNFT(VALUE_MOCK, VARIATION_MOCK, NFT_NAME_MOCK, IMAGE_MOCK, false);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: OTHER_NAME_TYPE,
            variation: VARIATION_MOCK,
          }),
        mockState,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: undefined,
        hasPetname: false,
        image: undefined,
        name: null,
      });
    });
  });

  describe('Priority', () => {
    it('uses petname as first priority', () => {
      mockPetname(PETNAME_MOCK);
      mockFirstPartyContractName(
        VALUE_MOCK,
        VARIATION_MOCK,
        FIRST_PARTY_CONTRACT_NAME_MOCK,
      );
      mockNFT(VALUE_MOCK, VARIATION_MOCK, NFT_NAME_MOCK, IMAGE_MOCK, false);
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);
      mockWatchedNFTName(VALUE_MOCK, VARIATION_MOCK, WATCHED_NFT_NAME_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: ERC20_TOKEN_NAME_MOCK,
        hasPetname: true,
        image: IMAGE_MOCK,
        name: PETNAME_MOCK,
      });
    });

    it('uses first-party contract name as second priority', () => {
      mockFirstPartyContractName(
        VALUE_MOCK,
        VARIATION_MOCK,
        FIRST_PARTY_CONTRACT_NAME_MOCK,
      );
      mockNFT(VALUE_MOCK, VARIATION_MOCK, NFT_NAME_MOCK, IMAGE_MOCK, false);
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);
      mockWatchedNFTName(VALUE_MOCK, VARIATION_MOCK, WATCHED_NFT_NAME_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: ERC20_TOKEN_NAME_MOCK,
        hasPetname: false,
        image: IMAGE_MOCK,
        name: FIRST_PARTY_CONTRACT_NAME_MOCK,
      });
    });

    it('uses NFT name as third priority', () => {
      mockNFT(VALUE_MOCK, VARIATION_MOCK, NFT_NAME_MOCK, IMAGE_MOCK, false);
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);
      mockWatchedNFTName(VALUE_MOCK, VARIATION_MOCK, WATCHED_NFT_NAME_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: ERC20_TOKEN_NAME_MOCK,
        hasPetname: false,
        image: IMAGE_MOCK,
        name: NFT_NAME_MOCK,
      });
    });

    it('uses ERC-20 token name as fourth priority', () => {
      mockERC20TokenName(VALUE_MOCK, ERC20_TOKEN_NAME_MOCK, SYMBOL_MOCK);
      mockWatchedNFTName(VALUE_MOCK, VARIATION_MOCK, WATCHED_NFT_NAME_MOCK);

      const { result } = renderHookWithProvider(
        () =>
          useDisplayName({
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            variation: VARIATION_MOCK,
          }),
        state,
      );

      expect(result.current).toStrictEqual({
        contractDisplayName: ERC20_TOKEN_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        name: ERC20_TOKEN_NAME_MOCK,
      });
    });
  });
});
