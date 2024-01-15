import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Text,
} from '../../../../component-library';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import {
  GAS_INPUT_MODES,
  acknowledgeRecipientWarning,
  getGasInputMode,
  getGasLimit,
  getGasPrice,
  getIsBalanceInsufficient,
  getMinimumGasLimitForSend,
  getRecipient,
  getRecipientWarningAcknowledgement,
  getSendAsset,
} from '../../../../../ducks/send';
import AdvancedGasInputs from '../../../../app/advanced-gas-inputs';
import { ConfirmGasDisplay } from '../../../../app/confirm-gas-display';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';
import {
  setCustomGasLimit,
  setCustomGasPrice,
} from '../../../../../ducks/gas/gas.duck';
import { AssetPickerAmount } from '../../..';
import { I18nContext } from '../../../../../contexts/i18n';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { KNOWN_RECIPIENT_ADDRESS_WARNING } from '../../../../../pages/send/send.constants';
import { SendHexData, SendPageRow } from '.';

export const SendPageContent = () => {
  const t = useContext(I18nContext);
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
  const gasPrice = useSelector(getGasPrice);
  const gasLimit = useSelector(getGasLimit);
  const minimumGasLimitForSend = useSelector(getMinimumGasLimitForSend);
  const minimumGasLimit = hexToDecimal(minimumGasLimitForSend);

  const gasInputMode = useSelector(getGasInputMode);
  const insufficientBalance = useSelector(getIsBalanceInsufficient);

  const recipient = useSelector(getRecipient);
  const isWarningAck = useSelector(getRecipientWarningAcknowledgement);
  const showWarningBanner =
    recipient.warning === KNOWN_RECIPIENT_ADDRESS_WARNING && !isWarningAck;

  const updateGasPrice = (newGasPrice: string) => {
    dispatch(updateGasPrice(newGasPrice));
    dispatch(setCustomGasPrice(newGasPrice));
  };

  const updateGasLimit = (newLimit: string) => {
    dispatch(updateGasLimit(newLimit));
    dispatch(setCustomGasLimit(newLimit));
  };

  const ackRecipientWarning = () => {
    dispatch(acknowledgeRecipientWarning());
  };

  return (
    <Box>
      {showWarningBanner ? (
        <SendPageRow>
          <BannerAlert
            severity={BannerAlertSeverity.Danger}
            actionButtonLabel={t('tooltipApproveButton')}
            actionButtonOnClick={ackRecipientWarning}
            actionButtonProps={{
              marginTop: 2,
              variant: TextVariant.bodyXs,
            }}
          >
            <Text variant={TextVariant.bodyXs}>
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
            </Text>
          </BannerAlert>
        </SendPageRow>
      ) : null}

      <SendPageRow>
        <AssetPickerAmount />
      </SendPageRow>
      {showHexData ? <SendHexData /> : null}
      {gasInputMode === GAS_INPUT_MODES.INLINE ? (
        <SendPageRow>
          <AdvancedGasInputs
            updateCustomGasPrice={updateGasPrice}
            updateCustomGasLimit={updateGasLimit}
            customGasPrice={gasPrice}
            customGasLimit={gasLimit}
            insufficientBalance={insufficientBalance}
            minimumGasLimit={minimumGasLimit}
            customPriceIsSafe
            isSpeedUp={false}
          />
        </SendPageRow>
      ) : null}
      <SendPageRow>
        <ConfirmGasDisplay />
      </SendPageRow>
    </Box>
  );
};
