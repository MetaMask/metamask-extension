import { Hex } from '@metamask/utils';
import { MetaMaskReduxState } from '../../../store/store';
import {
  getSamplePetnamesByChainIdAndAddress,
  getPetNamesForCurrentChain,
} from './selectors';

const mockChainId = '0x1' as Hex;

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: () => mockChainId,
}));

describe('sample-petnames-controller selectors', () => {
  const mockAddress1 = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
  const mockAddress2 = '0xabcdef1234567890abcdef1234567890abcdef12' as Hex;

  const mockState = {
    metamask: {
      samplePetnamesByChainIdAndAddress: {
        [mockChainId]: {
          [mockAddress1]: 'TestName1',
          [mockAddress2]: 'TestName2',
        },
        '0x2': {
          [mockAddress1]: 'TestNameOnOtherChain',
        },
      },
    },
  } as unknown as MetaMaskReduxState;

  describe('selectors', () => {
    it('should select the pet names by chain and address', () => {
      const result = getSamplePetnamesByChainIdAndAddress(mockState);
      expect(result).toEqual(
        mockState.metamask.samplePetnamesByChainIdAndAddress,
      );
    });

    it('should select pet names for the current chain', () => {
      const result = getPetNamesForCurrentChain(mockState);
      expect(result).toEqual({
        [mockAddress1]: 'TestName1',
        [mockAddress2]: 'TestName2',
      });
    });
  });
});
