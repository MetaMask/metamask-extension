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

  // FIXME: these should all be resolved before marking the PR as ready
  // TODO: SWAP+SEND impl steps (all but step 6 correlate to a PR in the merge train):
  // TODO: 1. add disabled (i.e., only 1-to-1) destination swap button to send page; update layout/designs (split as needed)
  // TODO: 2. begin design review + revisions
  //          - fix modal scroll behavior
  //          - remove background for 721/1155 images
  //          - double border weight for dropdowns
  // TODO: 3. create/add data flows for swap+send
  // TODO: 4. enable destination swap button (i.e., allow 1-to-any swaps) on send page; integrate data flows
  // TODO: 5 add error states
  // TODO: 6. add analytics
  //       - use transaction lifecycle events
  // TODO: 8. final design and technical review + revisions
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
