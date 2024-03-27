import { NftContract } from '@metamask/assets-controllers';
import {
  getNftContractsByAddressByChain,
  getNftContractsByAddressOnCurrentChain,
} from './nft';

function buildNftContractMock(index: number): NftContract {
  return {
    address: `0x${index}`,
    name: `Contract ${index}`,
    logo: `test${index}.jpg`,
  };
}

describe('NFT Selectors', () => {
  describe('getNftContractsByAddressByChain', () => {
    it('returns all contracts keyed by address and chain ID', () => {
      const contractMock1 = buildNftContractMock(1);
      const contractMock2 = buildNftContractMock(2);
      const contractMock3 = buildNftContractMock(3);
      const contractMock4 = buildNftContractMock(4);
      const contractMock5 = buildNftContractMock(5);
      const chainIdMock1 = '0x1';
      const chainIdMock2 = '0x2';
      const userAccountMock1 = '0x3';
      const userAccountMock2 = '0x4';

      const state = {
        metamask: {
          allNftContracts: {
            [userAccountMock1]: {
              [chainIdMock1]: [contractMock1, contractMock2],
              [chainIdMock2]: [contractMock4],
            },
            [userAccountMock2]: {
              [chainIdMock1]: [contractMock2, contractMock3],
              [chainIdMock2]: [contractMock5],
            },
          },
        },
      };

      expect(getNftContractsByAddressByChain(state)).toStrictEqual({
        [chainIdMock1]: {
          [contractMock1.address]: contractMock1,
          [contractMock2.address]: contractMock2,
          [contractMock3.address]: contractMock3,
        },
        [chainIdMock2]: {
          [contractMock4.address]: contractMock4,
          [contractMock5.address]: contractMock5,
        },
      });
    });
  });

  describe('getNftContractsByAddressOnCurrentChain', () => {
    it('returns all contracts keyed by address', () => {
      const contractMock1 = buildNftContractMock(1);
      const contractMock2 = buildNftContractMock(2);
      const contractMock3 = buildNftContractMock(3);
      const contractMock4 = buildNftContractMock(4);
      const contractMock5 = buildNftContractMock(5);
      const chainIdMock1 = '0x1';
      const chainIdMock2 = '0x2';
      const userAccountMock1 = '0x3';
      const userAccountMock2 = '0x4';

      const state = {
        metamask: {
          providerConfig: {
            chainId: chainIdMock1,
          },
          allNftContracts: {
            [userAccountMock1]: {
              [chainIdMock1]: [contractMock1, contractMock2],
              [chainIdMock2]: [contractMock4],
            },
            [userAccountMock2]: {
              [chainIdMock1]: [contractMock2, contractMock3],
              [chainIdMock2]: [contractMock5],
            },
          },
        },
      };

      expect(getNftContractsByAddressOnCurrentChain(state)).toStrictEqual({
        [contractMock1.address]: contractMock1,
        [contractMock2.address]: contractMock2,
        [contractMock3.address]: contractMock3,
      });
    });
  });
});
