import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  ASSETS_ROUTE,
  PRIVACY_ROUTE,
} from '../../../../../helpers/constants/routes';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../../../../selectors/multichain/feature-flags';

type NftsDetectionNoticeImportNFTsProps = {
  onActionButtonClick: () => void;
};

export default function NftsDetectionNoticeImportNFTs({
  onActionButtonClick,
}: NftsDetectionNoticeImportNFTsProps) {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isBasicFunctionalityConsolidationEnabled = useSelector(
    getIsBasicFunctionalityConsolidationEnabled,
  );

  const description = isBasicFunctionalityConsolidationEnabled
    ? t('newNFTDetectedInImportNFTsBasicFunctionalityMsg', [
        <b key="new-nft-detected-in-import-nfts-message-strong-text">
          {t('newNFTDetectedInImportNFTsBasicFunctionalityStrongText')}
        </b>,
      ])
    : t('newNFTDetectedInImportNFTsMsg', [
        <b key="new-nft-detected-in-import-nfts-message-strong-text">
          {t('newNFTDetectedInImportNFTsMessageStrongText')}
        </b>,
      ]);

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Info}
      description={description}
      actionButtonLabel={
        isBasicFunctionalityConsolidationEnabled
          ? t('turnOnBasicFunctionality')
          : t('selectEnableDisplayMediaPrivacyPreference')
      }
      actionButtonProps={{ type: 'button' }}
      actionButtonOnClick={(event) => {
        event.preventDefault();
        navigate(
          isBasicFunctionalityConsolidationEnabled
            ? `${PRIVACY_ROUTE}#basic-functionality`
            : `${ASSETS_ROUTE}#display-nft-media`,
        );
        onActionButtonClick?.();
      }}
    />
  );
}
