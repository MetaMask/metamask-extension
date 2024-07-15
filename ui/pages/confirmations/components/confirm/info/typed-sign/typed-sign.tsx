import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { parseTypedDataMessage } from '../../../../../../../shared/modules/transaction.utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { getTokenStandardAndDetails } from '../../../../../../store/actions';
import { SignatureRequestType } from '../../../../types/confirm';
import { isPermitSignatureRequest } from '../../../../utils';
import { selectUseTransactionSimulations } from '../../../../selectors/preferences';
import { ConfirmInfoRowTypedSignData } from '../../row/typed-sign-data/typedSignData';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { PermitSimulation } from './permit-simulation';

const TypedSignInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;
  const useTransactionSimulations = useSelector(
    selectUseTransactionSimulations,
  );
  const [decimals, setDecimals] = useState<number>(0);

  if (!currentConfirmation?.msgParams) {
    return null;
  }

  const {
    domain: { verifyingContract },
    message: { spender },
  } = parseTypedDataMessage(currentConfirmation.msgParams.data as string);

  const isPermit = isPermitSignatureRequest(currentConfirmation);

  useEffect(() => {
    (async () => {
      if (!isPermit) {
        return;
      }
      const { decimals: tokenDecimals } = await getTokenStandardAndDetails(
        verifyingContract,
      );
      setDecimals(parseInt(tokenDecimals ?? '0', 10));
    })();
  }, [verifyingContract]);

  return (
    <>
      {isPermit && useTransactionSimulations && (
        <PermitSimulation tokenDecimals={decimals} />
      )}
      <ConfirmInfoSection>
        {isPermit && (
          <>
            <ConfirmInfoRow label={t('spender')}>
              <ConfirmInfoRowAddress address={spender} />
            </ConfirmInfoRow>
            <ConfirmInfoRowDivider />
          </>
        )}
        <ConfirmInfoRow label={t('requestFrom')} tooltip={t('requestFromInfo')}>
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </ConfirmInfoRow>
        {verifyingContract && (
          <ConfirmInfoRow label={t('interactingWith')}>
            <ConfirmInfoRowAddress address={verifyingContract} />
          </ConfirmInfoRow>
        )}
      </ConfirmInfoSection>
      <ConfirmInfoSection>
        <ConfirmInfoRow label={t('message')}>
          <ConfirmInfoRowTypedSignData
            data={currentConfirmation.msgParams?.data as string}
            isPermit={isPermit}
            tokenDecimals={decimals}
          />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
};

export default TypedSignInfo;
