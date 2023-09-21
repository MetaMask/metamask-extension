import React from 'react';
import { useHistory } from 'react-router-dom';
import { BannerAlert } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SECURITY_ROUTE } from '../../../helpers/constants/routes';

export default function NftsDetectionNoticeImportNFTs() {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <BannerAlert
      className="nfts-detection-notice"
      actionButtonLabel={t('selectDisplayMediaPrivacyPreference')}
      actionButtonOnClick={(e) => {
        e.preventDefault();
        history.push(`${SECURITY_ROUTE}#opensea-api`);
      }}
    >
      {t('newNFTDetectedInImportNFTsMessage', [
        <b key="new-nft-detected-in-import-nfts-message-strong-text">
          {t('newNFTDetectedInImportNFTsMessageStrongText')}
        </b>,
      ])}
    </BannerAlert>
  );
}
