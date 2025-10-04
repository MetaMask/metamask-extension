import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRow } from '../../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoRowText } from '../../../../../../components/app/confirm/info/row/text';
import { ConfirmInfoRowAddress } from '../../../../../../components/app/confirm/info/row';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { useApprovalRequest } from '../../../../hooks/useApprovalRequest';
import { ExampleRequestData } from './types';

export const APPROVAL_TYPE_EXAMPLE = 'example' as ApprovalType;

export function ExampleInfo() {
  const { requestData } = useApprovalRequest<ExampleRequestData>() ?? {};

  return (
    <>
      <ConfirmInfoSection>
        <ConfirmInfoRow label="Text Row">
          <ConfirmInfoRowText text="Example Text" />
        </ConfirmInfoRow>
        <ConfirmInfoRow label="Address Row">
          <ConfirmInfoRowAddress
            address="0x1234567890abcdef1234567890abcdef12345678"
            chainId={CHAIN_IDS.MAINNET}
          />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
      <ConfirmInfoSection>
        <ConfirmInfoRow label="Request Data">
          <ConfirmInfoRowText text={requestData?.exampleField ?? '-'} />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
}
