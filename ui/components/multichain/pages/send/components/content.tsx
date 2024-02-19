import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
} from '../../../../component-library';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import {
  acknowledgeRecipientWarning,
  getSendAsset,
} from '../../../../../ducks/send';
import { ConfirmGasDisplay } from '../../../../../pages/confirmations/components/confirm-gas-display';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import { Display } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AssetPickerAmount } from '../../..';
import { SendHexData, SendPageRow } from '.';

export const SendPageContent = ({
  requireContractAddressAcknowledgement,
}: {
  requireContractAddressAcknowledgement: boolean;
}) => {
  const t = useI18nContext();

  // Hex data
  const showHexDataFlag = useSelector(getSendHexDataFeatureFlagState);
  const asset = useSelector(getSendAsset);
  const showHexData =
    showHexDataFlag &&
    asset &&
    asset.type !== AssetType.token &&
    asset.type !== AssetType.NFT;

  // Gas data
  const dispatch = useDispatch();

  return (
    <Box>
      {requireContractAddressAcknowledgement ? (
        <SendPageRow>
          <BannerAlert
            severity={BannerAlertSeverity.Danger}
            data-testid="send-warning"
            actionButtonLabel={t('tooltipApproveButton')}
            actionButtonOnClick={() => {
              dispatch(acknowledgeRecipientWarning());
            }}
            actionButtonProps={{ display: Display.Block, marginTop: 4 }}
          >
            {t('sendingToTokenContractWarning', [
              <a
                key="contractWarningSupport"
                target="_blank"
                rel="noopener noreferrer"
                className="send__warning-container__link"
                href={CONTRACT_ADDRESS_LINK}
              >
                {t('learnMoreUpperCase')}
              </a>,
            ])}
          </BannerAlert>
        </SendPageRow>
      ) : null}
      <SendPageRow>
        <AssetPickerAmount />
      </SendPageRow>
      {showHexData ? <SendHexData /> : null}
      <SendPageRow>
        <ConfirmGasDisplay />
      </SendPageRow>
    </Box>
  );
};
