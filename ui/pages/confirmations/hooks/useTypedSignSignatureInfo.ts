import { useMemo } from 'react';

import {
  getEip712TokenId,
  isOrderSignatureRequest,
  isPermitSignatureRequest,
  isSignatureTransactionType,
  parseSanitizeTypedDataMessage,
} from '../utils';
import { SignatureRequestType } from '../types/confirm';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { TypedSignSignaturePrimaryTypes } from '../constants';

export const useTypedSignSignatureInfo = (
  confirmation: SignatureRequestType,
) => {
  const primaryType = useMemo(() => {
    if (
      !confirmation ||
      !isSignatureTransactionType(confirmation) ||
      confirmation?.type !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA
    ) {
      return undefined;
    }
    if (isPermitSignatureRequest(confirmation)) {
      return TypedSignSignaturePrimaryTypes.PERMIT;
    } else if (isOrderSignatureRequest(confirmation)) {
      return TypedSignSignaturePrimaryTypes.ORDER;
    }
    return undefined;
  }, [confirmation]);

  const tokenStandard = useMemo(() => {
    if (primaryType !== TypedSignSignaturePrimaryTypes.PERMIT) {
      return undefined;
    }

    const { message, types, primaryType: messagePrimaryType } =
      parseSanitizeTypedDataMessage(
        confirmation?.msgParams?.data as string,
      );

    if (getEip712TokenId(message, types, messagePrimaryType) !== undefined) {
      return TokenStandard.ERC721;
    }
    return undefined;
  }, [confirmation, primaryType]);

  return {
    primaryType: primaryType as keyof typeof TypedSignSignaturePrimaryTypes,
    tokenStandard,
  };
};
