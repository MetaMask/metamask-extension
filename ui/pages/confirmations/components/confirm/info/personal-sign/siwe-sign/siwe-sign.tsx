import React from 'react';
import { useSelector } from 'react-redux';
import { toHex } from '@metamask/controller-utils';

import { NETWORK_TO_NAME_MAP } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import { SignatureRequestType } from '../../../../../types/confirm';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { fa } from '../../../../../../../../.storybook/locales';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const SIWESignInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  if (!currentConfirmation.msgParams?.siwe?.parsedMessage) {
    return null;
  }

  const siweMessage = currentConfirmation.msgParams.siwe?.parsedMessage;
  const chainId = toHex(siweMessage.chainId);

  return (
    <>
      <ConfirmInfoRow label={t('siweOriginalMessage')}>
        <ConfirmInfoRowText text={siweMessage.statement} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweURI')}>
        <ConfirmInfoRowText text={siweMessage.domain} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweNetwork')}>
        <ConfirmInfoRowText
          text={
            (NETWORK_TO_NAME_MAP as Record<string, string>)[chainId] ?? chainId
          }
        />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweAccount')}>
        <ConfirmInfoRowAddress address={siweMessage.address} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweVersion')}>
        <ConfirmInfoRowText text={siweMessage.version} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweChainID')}>
        <ConfirmInfoRowText text={`${siweMessage.chainId}`} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweNonce')}>
        <ConfirmInfoRowText text={siweMessage.nonce} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('siweIssued')}>
        <ConfirmInfoRowText text={formatDate(siweMessage.issuedAt)} />
      </ConfirmInfoRow>
      {siweMessage.requestId && (
        <ConfirmInfoRow label={t('siweRequestId')}>
          <ConfirmInfoRowText text={siweMessage.requestId} />
        </ConfirmInfoRow>
      )}
      {siweMessage.resources && (
        <ConfirmInfoRow label={t('siweResources')}>
          {siweMessage.resources.map((resource) => (
            <ConfirmInfoRowText text={resource} />
          ))}
        </ConfirmInfoRow>
      )}
    </>
  );
};

export default SIWESignInfo;
