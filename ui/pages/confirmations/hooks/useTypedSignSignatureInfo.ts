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

  // here we are using presence of tokenId in typed message data to know if its NFT permit
  // we can get contract details for verifyingContract but that is async process taking longer
  // and result in confirmation page content loading late
  const tokenStandard = useMemo(() => {
    if (primaryType !== TypedSignSignaturePrimaryTypes.PERMIT) {
      return undefined;
    }
    console.log(confirmation, confirmation?.msgParams?.data);
    const {
      message: { tokenId },
    } = parseTypedDataMessage(confirmation?.msgParams?.data as string);
    if (tokenId !== undefined) {
      return TokenStandard.ERC721;
    }
    return undefined;
  }, [confirmation, primaryType]);

  return {
    primaryType: primaryType as keyof typeof TypedSignSignaturePrimaryTypes,
    tokenStandard,
  };
};
