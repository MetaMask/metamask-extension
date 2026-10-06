import React from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getAllChainsToPoll,
  getOpenSeaEnabled,
} from '../../../../../selectors/selectors';
import {
  detectNfts,
  setOpenSeaEnabled,
  setUseNftDetection,
} from '../../../../../store/actions';
import { SECOND } from '../../../../../../shared/constants/time';
import { ToastContent } from '../../../../ui/toast/toast';
import { BannerAlert } from '../../../../component-library/banner-alert/banner-alert';
import { useDispatch } from '../../../../../store/hooks';

const nftDetectionEnabledToastId = 'enabled-nft-auto-detection';
const autoHideToastDelay = 5 * SECOND;

export default function NFTsDetectionNoticeNFTsTab() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isDisplayNFTMediaToggleEnabled = useSelector(getOpenSeaEnabled);
  const allChainIds = useSelector(getAllChainsToPoll);

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
        toast.success(
          <ToastContent
            dataTestId={nftDetectionEnabledToastId}
            title={t('nftAutoDetectionEnabled')}
          />,
          {
            id: nftDetectionEnabledToastId,
            duration: autoHideToastDelay,
          },
        );
        // dispatch action to detect nfts
        dispatch(detectNfts(allChainIds));
      }}
    >
      {t('newNFTDetectedInNFTsTabMessage')}
    </BannerAlert>
  );
}
