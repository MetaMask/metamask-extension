import { Hex } from '@metamask/utils';
import {
  getSamplePetnamesByChainIdAndAddress,
  getPetNamesForCurrentChain,
} from './sample-petnames-controller-selectors';

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: (state: any) => state.metamask.provider.chainId,
}));

describe('sample-petnames-controller selectors', () => {
  const mockChainId = '0x1' as Hex;
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
      provider: {
        chainId: mockChainId,
      },
    },
  };

  describe('selectors', () => {
    it('should select the pet names by chain and address', () => {
      const result = getSamplePetnamesByChainIdAndAddress(mockState as any);
      expect(result).toEqual(
        mockState.metamask.samplePetnamesByChainIdAndAddress,
      );
    });

    it('should select pet names for the current chain', () => {
      const result = getPetNamesForCurrentChain(mockState as any);
      expect(result).toEqual({
        [mockAddress1]: 'TestName1',
        [mockAddress2]: 'TestName2',
      });
    });
  });
});
