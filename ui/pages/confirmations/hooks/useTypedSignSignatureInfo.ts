import { useMemo } from 'react';

import {
  isOrderSignatureRequest,
  isPermitSignatureRequest,
  isSignatureTransactionType,
} from '../utils';
import { SignatureRequestType } from '../types/confirm';
import { parseTypedDataMessage } from '../../../../shared/modules/transaction.utils';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { TypedSignSignaturePrimaryTypes } from '../constants';

export const useTypedSignSignatureInfo = (
  confirmation: SignatureRequestType,
) => {
  if (!confirmation) {
    return {};
  }
  if (
    !isSignatureTransactionType(confirmation) ||
    confirmation?.type !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA
  ) {
    return {};
  }
  const primaryType = useMemo(() => {
    if (isPermitSignatureRequest(confirmation)) {
      return TypedSignSignaturePrimaryTypes.PERMIT;
    } else if (isOrderSignatureRequest(confirmation)) {
      return TypedSignSignaturePrimaryTypes.ORDER;
    }
    return undefined;
  }, [confirmation]);

  const tokenStandard = useMemo(() => {
    const {
      message: { tokenId },
    } = parseTypedDataMessage(confirmation?.msgParams?.data as string);
    if (tokenId !== undefined) {
      return TokenStandard.ERC721;
    }
    return undefined;
  }, [confirmation]);

  return { primaryType, tokenStandard };
};
