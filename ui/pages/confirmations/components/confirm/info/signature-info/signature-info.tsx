import { TransactionType } from '@metamask/transaction-controller';
import React, { useMemo } from 'react';
import { getEnabledAdvancedPermissions } from '../../../../../../../shared/modules/environment';
import { useSignatureRequest } from '../../../../hooks/useSignatureRequest';
import PersonalSignInfo from '../personal-sign/personal-sign';
import TypedSignV1Info from '../typed-sign-v1/typed-sign-v1';
import TypedSignInfo from '../typed-sign/typed-sign';
import TypedSignPermissionInfo from '../typed-sign/typed-sign-permission';

/**
 * Renders the appropriate info component for signature-type confirmations.
 * Uses the type from the signature request to determine which info component to render.
 *
 * @returns The appropriate info component for the signature type, or null.
 */
const SignatureInfo: React.FC = () => {
  const signatureRequest = useSignatureRequest();

  const InfoComponent = useMemo(() => {
    if (!signatureRequest?.type) {
      return null;
    }

    if (signatureRequest.type === TransactionType.personalSign) {
      return PersonalSignInfo;
    }

    if (signatureRequest.type === TransactionType.signTypedData) {
      const { version } = signatureRequest.msgParams ?? {};

      if (version === 'V1') {
        return TypedSignV1Info;
      }

      if (signatureRequest.decodedPermission) {
        if (getEnabledAdvancedPermissions().length === 0) {
          throw new Error('Gator permissions feature is not enabled');
        }
        return TypedSignPermissionInfo;
      }

      return TypedSignInfo;
    }

    return null;
  }, [signatureRequest]);

  if (!InfoComponent) {
    return null;
  }

  return <InfoComponent />;
};

export default SignatureInfo;
