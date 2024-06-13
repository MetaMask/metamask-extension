import React from 'react';
import { useDispatch } from 'react-redux';
import { BannerAlert } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  detectNfts,
  setShowNftDetectionEnablementToast,
  setUseNftDetection,
} from '../../../store/actions';

export default function NFTsDetectionNoticeNFTsTab() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <BannerAlert
      className="nfts-detection-notice"
      title={t('newNFTsAutodetected')}
      actionButtonLabel={t('selectNFTPrivacyPreference')}
      actionButtonOnClick={() => {
        dispatch(setUseNftDetection(true));
        // Show toast
        dispatch(setShowNftDetectionEnablementToast(true));
        // dispatch action to detect nfts
        dispatch(detectNfts());
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
