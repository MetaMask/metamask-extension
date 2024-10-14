import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getOpenSeaEnabled } from '../../../../../selectors';
import {
  detectNfts,
  setOpenSeaEnabled,
  setUseNftDetection,
} from '../../../../../store/actions';
import { BannerAlert } from '../../../../component-library';
import { setShowNftDetectionEnablementToast } from '../../../toast-master/utils';

export default function NFTsDetectionNoticeNFTsTab() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isDisplayNFTMediaToggleEnabled = useSelector(getOpenSeaEnabled);

  return (
    <BannerAlert
      className="nfts-detection-notice"
      title={t('newNFTsAutodetected')}
      actionButtonLabel={t('selectNFTPrivacyPreference')}
      actionButtonOnClick={() => {
        if (!isDisplayNFTMediaToggleEnabled) {
          dispatch(setOpenSeaEnabled(true));
        }
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
