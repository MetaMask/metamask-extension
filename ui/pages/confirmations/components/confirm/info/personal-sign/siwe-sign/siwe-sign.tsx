import React from 'react';
import { DateTime } from 'luxon';
import { toHex } from '@metamask/controller-utils';

import { NETWORK_TO_NAME_MAP } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../../../../types/confirm';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDate,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { useConfirmContext } from '../../../../../context/confirm';

const SIWESignInfo: React.FC = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();

  const siweMessage = currentConfirmation?.msgParams?.siwe?.parsedMessage;

  if (!siweMessage) {
    return null;
  }

  const {
    address,
    chainId,
    domain,
    issuedAt,
    nonce,
    requestId,
    statement,
    resources,
    version,
  } = siweMessage;
  const hexChainId = toHex(chainId);
  const network =
    (NETWORK_TO_NAME_MAP as Record<string, string>)[hexChainId] ?? hexChainId;

  return (
    <>
      <ConfirmInfoRow label={t('message')}>
        <ConfirmInfoRowText text={statement || ''} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweURI')}>
        <ConfirmInfoRowText text={domain} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweNetwork')}>
        <ConfirmInfoRowText text={network} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('account')}>
        <ConfirmInfoRowAddress address={address} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('version')}>
        <ConfirmInfoRowText text={version} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('chainId')}>
        <ConfirmInfoRowText text={`${chainId}`} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('nonce')}>
        <ConfirmInfoRowText text={nonce} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweIssued')}>
        <ConfirmInfoRowDate
          date={DateTime.fromISO(issuedAt).toJSDate().getTime()}
        />
      </ConfirmInfoRow>
      {requestId && (
        <ConfirmInfoRow label={t('siweRequestId')}>
          <ConfirmInfoRowText text={requestId} />
        </ConfirmInfoRow>
      )}
      {resources && (
        <ConfirmInfoRow label={t('siweResources')}>
          {resources.map((resource, index) => (
            <ConfirmInfoRowText key={`resource-${index}`} text={resource} />
          ))}
        </ConfirmInfoRow>
      )}
    </>
  );
};

export default SIWESignInfo;
