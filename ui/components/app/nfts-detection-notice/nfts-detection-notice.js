import React from 'react';
import { useHistory } from 'react-router-dom';
import { BannerAlert } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SECURITY_ROUTE } from '../../../helpers/constants/routes';

export default function NftsDetectionNotice() {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <BannerAlert
      className="nfts-detection-notice"
      title={t('newNFTsDetected')}
      actionButtonLabel={t('selectNFTPrivacyPreference')}
      actionButtonOnClick={(e) => {
        e.preventDefault();
        history.push(`${SECURITY_ROUTE}#autodetect-nfts`);
      }}
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
        t('newNFTDetectedMessage')
        ///: END:ONLY_INCLUDE_IN
      }
      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
        t('mmiNewNFTDetectedMessage')
        ///: END:ONLY_INCLUDE_IN
      }
    </BannerAlert>
  );
}
