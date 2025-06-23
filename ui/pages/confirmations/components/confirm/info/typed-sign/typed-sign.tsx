import React from 'react';
import { isValidAddress } from 'ethereumjs-util';

import { isSnapId } from '@metamask/snaps-utils';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { parseTypedDataMessage } from '../../../../../../../shared/modules/transaction.utils';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../../../types/confirm';
import { useGetTokenStandardAndDetails } from '../../../../hooks/useGetTokenStandardAndDetails';
import {
  isOrderSignatureRequest,
  isPermitSignatureRequest,
} from '../../../../utils';
import { useConfirmContext } from '../../../../context/confirm';
import { useTypesSignSimulationEnabledInfo } from '../../../../hooks/useTypesSignSimulationEnabledInfo';
import { ConfirmInfoRowTypedSignData } from '../../row/typed-sign-data/typedSignData';
import { NetworkRow } from '../shared/network-row/network-row';
import { SigningInWithRow } from '../shared/sign-in-with-row/sign-in-with-row';
import { TypedSignV4Simulation } from './typed-sign-v4-simulation';

const TypedSignInfo: React.FC = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const isSimulationSupported = useTypesSignSimulationEnabledInfo();

  if (!currentConfirmation?.msgParams) {
    return null;
  }

  const {
    domain: { verifyingContract },
    message: { spender },
  } = parseTypedDataMessage(currentConfirmation.msgParams.data as string);

  const isPermit = isPermitSignatureRequest(currentConfirmation);
  const isOrder = isOrderSignatureRequest(currentConfirmation);
  const tokenContract = isPermit || isOrder ? verifyingContract : undefined;
  const { decimalsNumber } = useGetTokenStandardAndDetails(tokenContract);

  const chainId = currentConfirmation.chainId as string;

  const toolTipMessage = isSnapId(currentConfirmation.msgParams.origin)
    ? t('requestFromInfoSnap')
    : t('requestFromInfo');
  const msgData = currentConfirmation.msgParams?.data as string;

  return (
    <>
      {isSimulationSupported && <TypedSignV4Simulation />}
      <ConfirmInfoSection data-testid="confirmation_request-section">
        {isPermit && (
          <>
            <ConfirmInfoRow label={t('spender')}>
              <ConfirmInfoRowAddress address={spender} chainId={chainId} />
            </ConfirmInfoRow>
            <ConfirmInfoRowDivider />
          </>
        )}
        <NetworkRow isShownWithAlertsOnly />
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={toolTipMessage}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </ConfirmInfoAlertRow>
        {isValidAddress(verifyingContract) && (
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.InteractingWith}
            ownerId={currentConfirmation.id}
            label={t('interactingWith')}
            tooltip={t('interactingWithTransactionDescription')}
          >
            <ConfirmInfoRowAddress
              address={verifyingContract}
              chainId={chainId}
            />
          </ConfirmInfoAlertRow>
        )}
        <SigningInWithRow />
      </ConfirmInfoSection>
      <ConfirmInfoSection data-testid="confirmation_message-section">
        <ConfirmInfoRow
          label={t('message')}
          collapsed={isSimulationSupported}
          copyEnabled
          copyText={JSON.stringify(parseTypedDataMessage(msgData ?? {}))}
        >
          <ConfirmInfoRowTypedSignData
            data={msgData}
            tokenDecimals={decimalsNumber}
            chainId={chainId}
          />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
};

export default TypedSignInfo;
