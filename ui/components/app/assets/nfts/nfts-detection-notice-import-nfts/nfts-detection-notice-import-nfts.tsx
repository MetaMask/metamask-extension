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
import { getUseExternalServices } from '../../../../../selectors';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../../../../selectors/multichain/feature-flags';
import { toggleBasicFunctionality } from '../../../../../store/actions';
import { useDispatch } from '../../../../../store/hooks';
import { toast, ToastContent } from '../../../../ui/toast/toast';

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
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);

  const showBasicFunctionalityOnToast = () => {
    toast.success(
      <ToastContent
        dataTestId="basic-functionality-on-toast"
        title={t('basicFunctionalityIsOn')}
      />,
    );
  };

  const handleActionClick = () => {
    if (isBasicFunctionalityConsolidationEnabled) {
      if (isBasicFunctionalityEnabled) {
        showBasicFunctionalityOnToast();
        return;
      }
      dispatch(toggleBasicFunctionality(true));
      showBasicFunctionalityOnToast();
      return;
    }
    navigate(`${ASSETS_ROUTE}#display-nft-media`);
    onActionButtonClick?.();
  };

  const description = isBasicFunctionalityConsolidationEnabled
    ? t('newNFTDetectedInImportNFTsBasicFunctionalityMsg', [
        <TextButton
          key="turn-on-basic-functionality"
          type="button"
          size={TextButtonSize.BodySm}
          className="inline p-0 align-baseline"
          onClick={handleActionClick}
        >
          {t('turnOnBasicFunctionality')}
        </TextButton>,
      ])
    : t('newNFTDetectedInImportNFTsMsg', [
        <b key="new-nft-detected-in-import-nfts-message-strong-text">
          {t('newNFTDetectedInImportNFTsMessageStrongText')}
        </b>,
      ]);

  return (
    <BannerAlert severity={BannerAlertSeverity.Info}>
      <Box className="flex flex-col items-start gap-2">
        <Text variant={TextVariant.BodySm}>{description}</Text>
        {isBasicFunctionalityConsolidationEnabled ? null : (
          <TextButton
            type="button"
            size={TextButtonSize.BodySm}
            onClick={handleActionClick}
          >
            {t('selectEnableDisplayMediaPrivacyPreference')}
          </TextButton>
        )}
      </Box>
    </BannerAlert>
  );
}
