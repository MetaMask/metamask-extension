import React from 'react';
import { useHistory } from 'react-router-dom';
import { BannerAlert } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SECURITY_ROUTE } from '../../../helpers/constants/routes';

export default function NFTsDetectionNoticeNFTsTab() {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <BannerAlert
      className="nfts-detection-notice"
      title={t('newNFTsAutodetected')}
      actionButtonLabel={t('selectNFTPrivacyPreference')}
      actionButtonOnClick={(e) => {
        e.preventDefault();
        history.push(`${SECURITY_ROUTE}#autodetect-nfts`);
      }}
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        t('newNFTDetectedInNFTsTabMessage')
        ///: END:ONLY_INCLUDE_IF
      }
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        t('mmiNewNFTDetectedInNFTsTabMessage')
        ///: END:ONLY_INCLUDE_IF
      }
    </BannerAlert>
  );
}
