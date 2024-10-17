import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isValidAddress } from 'ethereumjs-util';

import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { parseTypedDataMessage } from '../../../../../../../shared/modules/transaction.utils';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../../../types/confirm';
import {
  isOrderSignatureRequest,
  isPermitSignatureRequest,
} from '../../../../utils';
import { fetchErc20Decimals } from '../../../../utils/token';
import { useConfirmContext } from '../../../../context/confirm';
import { selectUseTransactionSimulations } from '../../../../selectors/preferences';
import { ConfirmInfoRowTypedSignData } from '../../row/typed-sign-data/typedSignData';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { PermitSimulation } from './permit-simulation';

const TypedSignInfo: React.FC = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
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
  const isOrder = isOrderSignatureRequest(currentConfirmation);
  const chainId = currentConfirmation.chainId as string;

  useEffect(() => {
    (async () => {
      if (!isPermit && !isOrder) {
        return;
      }
      const tokenDecimals = await fetchErc20Decimals(verifyingContract);
      setDecimals(tokenDecimals);
    })();
  }, [verifyingContract]);

  return (
    <>
      {isPermit && useTransactionSimulations && <PermitSimulation />}
      <ConfirmInfoSection>
        {isPermit && (
          <>
            <ConfirmInfoRow label={t('spender')}>
              <ConfirmInfoRowAddress address={spender} chainId={chainId} />
            </ConfirmInfoRow>
            <ConfirmInfoRowDivider />
          </>
        )}
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={t('requestFromInfo')}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </ConfirmInfoAlertRow>
        {isValidAddress(verifyingContract) && (
          <ConfirmInfoRow label={t('interactingWith')}>
            <ConfirmInfoRowAddress
              address={verifyingContract}
              chainId={chainId}
            />
          </ConfirmInfoRow>
        )}
      </ConfirmInfoSection>
      <ConfirmInfoSection>
        <ConfirmInfoRow label={t('message')}>
          <ConfirmInfoRowTypedSignData
            data={currentConfirmation.msgParams?.data as string}
            tokenDecimals={decimals}
            chainId={chainId}
          />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
};

export default TypedSignInfo;
