import { renderHook } from '@testing-library/react-hooks';

import { TokenStandard } from '../../../../shared/constants/transaction';
import { permitNFTSignatureMsg } from '../../../../test/data/confirmations/typed_sign';
import { TypedSignSignaturePrimaryTypes } from '../constants';
import { useTypedSignSignatureInfo } from './useTypedSignSignatureInfo';

describe('useTypedSignSignatureInfo', () => {
  describe('isNftTransfer', () => {
    it('should return false if transaction is not NFT transfer', () => {
      const { result } = renderHook(() =>
        useTypedSignSignatureInfo(permitNFTSignatureMsg),
      );
      expect(result.current.primaryType).toStrictEqual(
        TypedSignSignaturePrimaryTypes.PERMIT,
      );
      expect(result.current.tokenStandard).toStrictEqual(TokenStandard.ERC721);
    });
  });
});
