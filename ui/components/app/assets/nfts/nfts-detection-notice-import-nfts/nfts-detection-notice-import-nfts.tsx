import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Text,
  TextButton,
  TextButtonSize,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ASSETS_ROUTE } from '../../../../../helpers/constants/routes';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../../../../selectors/multichain/feature-flags';
import { toggleBasicFunctionality } from '../../../../../store/actions';
import { useDispatch } from '../../../../../store/hooks';

type NftsDetectionNoticeImportNFTsProps = {
  onActionButtonClick: () => void;
};

export default function NftsDetectionNoticeImportNFTs({
  onActionButtonClick,
}: NftsDetectionNoticeImportNFTsProps) {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
  const actionLabel = isBasicFunctionalityConsolidationEnabled
    ? t('turnOnBasicFunctionality')
    : t('selectEnableDisplayMediaPrivacyPreference');

  return (
    <BannerAlert severity={BannerAlertSeverity.Info}>
      <Box className="flex flex-col items-start gap-2">
        <Text variant={TextVariant.BodySm}>{description}</Text>
        <TextButton
          type="button"
          size={TextButtonSize.BodySm}
          onClick={() => {
            if (isBasicFunctionalityConsolidationEnabled) {
              dispatch(toggleBasicFunctionality(true));
              return;
            }
            navigate(`${ASSETS_ROUTE}#display-nft-media`);
            onActionButtonClick?.();
          }}
        >
          {actionLabel}
        </TextButton>
      </Box>
    </BannerAlert>
  );
}
