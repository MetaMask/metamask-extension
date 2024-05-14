import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
} from '../../../../component-library';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import {
  acknowledgeRecipientWarning,
  getCurrentDraftTransaction,
  getSendAsset,
  updateSendAmount,
  updateSendAsset,
} from '../../../../../ducks/send';
import {
  AssetType,
  TokenStandard,
} from '../../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import { SEND_ROUTE } from '../../../../../helpers/constants/routes';
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

  const history = useHistory();

  // Hex data
  const showHexDataFlag = useSelector(getSendHexDataFeatureFlagState);
  const asset = useSelector(getSendAsset);
  const showHexData =
    showHexDataFlag &&
    asset &&
    asset.type !== AssetType.token &&
    asset.type !== AssetType.NFT;

  const { asset: transactionAsset, amount } = useSelector(
    getCurrentDraftTransaction,
  );

  // Gas data
  const dispatch = useDispatch();

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectToken = async (token: any) => {
    if (token.type === AssetType.native) {
      dispatch(
        updateSendAsset({
          type: token.type,
          details: token,
          skipComputeEstimatedGasLimit: false,
        }),
      );
    } else {
      dispatch(
        updateSendAsset({
          type: token.type ?? AssetType.token,
          details: {
            ...token,
            standard: token.standard ?? TokenStandard.ERC20,
          },
          skipComputeEstimatedGasLimit: false,
        }),
      );
    }
    history.push(SEND_ROUTE);
  };

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
        <AssetPickerAmount
          asset={transactionAsset}
          onAssetChange={handleSelectToken}
          amount={amount}
          onAmountChange={(newAmount: string) =>
            dispatch(updateSendAmount(newAmount))
          }
        />
      </SendPageRow>
      {showHexData ? <SendHexData /> : null}
    </Box>
  );
};
