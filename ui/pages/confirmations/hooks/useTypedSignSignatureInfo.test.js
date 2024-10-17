import { renderHook } from '@testing-library/react-hooks';

import { TokenStandard } from '../../../../shared/constants/transaction';
import { permitNFTSignatureMsg } from '../../../../test/data/confirmations/typed_sign';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { TypedSignSignaturePrimaryTypes } from '../constants';
import { useTypedSignSignatureInfo } from './useTypedSignSignatureInfo';

describe('useTypedSignSignatureInfo', () => {
  it('should return details for primaty type and token standard', () => {
    const { result } = renderHook(() =>
      useTypedSignSignatureInfo(permitNFTSignatureMsg),
    );
    expect(result.current.primaryType).toStrictEqual(
      TypedSignSignaturePrimaryTypes.PERMIT,
    );
    expect(result.current.tokenStandard).toStrictEqual(TokenStandard.ERC721);
  });

  it('should return empty object if confirmation is not typed sign', () => {
    const { result } = renderHook(() =>
      useTypedSignSignatureInfo(unapprovedPersonalSignMsg),
    );
    expect(result.current.primaryType).toBeUndefined();
    expect(result.current.tokenStandard).toBeUndefined();
  });
});
