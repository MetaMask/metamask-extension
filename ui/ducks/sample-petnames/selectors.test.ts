import { Hex } from '@metamask/utils';
import { MetaMaskReduxState } from '../../store/store';
import {
  getSamplePetnamesByChainIdAndAddress,
  getPetnamesForCurrentChain,
} from './selectors';
import { SamplePetnamesControllerState } from '@metamask/sample-controllers';

const mockAddress1 = '0xabc' as Hex;
const mockAddress2 = '0xdef' as Hex;

// Mock the networks selector
jest.mock('../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: () => '0x1',
}));

describe('sample-petnames-controller selectors', () => {
  describe('selectors', () => {
    const mockState = {
      metamask: {
        namesByChainIdAndAddress: {
          '0x1': {
            [mockAddress1]: 'Test Name 1',
            [mockAddress2]: 'Test Name 2',
          },
          '0x2': {
            '0x123': 'Test Name 3',
          },
        },
        provider: {
          chainId: '0x1',
        },
      },
    } as unknown as MetaMaskReduxState;

    it('should select the pet names by chain and address', () => {
      const result = getSamplePetnamesByChainIdAndAddress(mockState);
      expect(result).toEqual(mockState.metamask.namesByChainIdAndAddress);
    });

    it('should select pet names for the current chain', () => {
      const result = getPetnamesForCurrentChain(mockState);
      expect(result).toEqual({
        [mockAddress1]: 'Test Name 1',
        [mockAddress2]: 'Test Name 2',
      });
    });
  });
});
