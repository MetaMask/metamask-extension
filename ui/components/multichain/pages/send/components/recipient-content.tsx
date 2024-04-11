import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
} from '../../../../component-library';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import {
  Asset,
  acknowledgeRecipientWarning,
  getBestQuote,
  getCurrentDraftTransaction,
  getSendAsset,
} from '../../../../../ducks/send';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import { Display } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AssetPickerAmount } from '../../..';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';
import { SendHexData, SendPageRow, QuoteCard } from '.';

export const SendPageRecipientContent = ({
  requireContractAddressAcknowledgement,
  onAssetChange,
}: {
  requireContractAddressAcknowledgement: boolean;
  onAssetChange: (newAsset: Asset, isReceived: boolean) => void;
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

  const {
    receiveAsset,
    sendAsset,
    amount: sendAmount,
    isSwapQuoteLoading,
  } = useSelector(getCurrentDraftTransaction);

  const isSendingToken = [AssetType.token, AssetType.native].includes(
    sendAsset.type,
  );

  const bestQuote = useSelector(getBestQuote);

  const isLoadingInitialQuotes = !bestQuote && isSwapQuoteLoading;

  const amount =
    receiveAsset.details?.address === sendAsset.details?.address
      ? sendAmount
      : { value: decimalToHex(bestQuote?.destinationAmount || '0') };

  // Gas data
  const dispatch = useDispatch();

  // FIXME: these should all be resolved before marking the PR as ready
  // TODO: SWAP+SEND impl steps (all but step 3 correlate to a PR in the merge train):
  // TODO: 1. begin design review + revisions
  //          - add pre-transaction validation and refetch if it doesn't match
  //          - test hex data input (advanced settings)
  //          - handle repopulations
  //          - resolve all TODOs
  //          - handle approval gas
  //          - implement hester's comment: https://consensys.slack.com/archives/C068SFX90PN/p1712696346996319
  //          - investigate overflow logic
  //          - Preserve dest token when returning to send page from tx page
  //          - Ensure max button works with swaps (update on refresh? buffer?)
  // TODO: 2. add analytics + e2e tests
  //       - use transaction lifecycle events once
  // TODO: 3. final design and technical review + revisions
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
          asset={isSendingToken ? receiveAsset : sendAsset}
          sendingAsset={isSendingToken ? sendAsset : undefined}
          onAssetChange={useCallback(
            (newAsset) => onAssetChange(newAsset, isSendingToken),
            [onAssetChange, isSendingToken],
          )}
          isAmountLoading={isLoadingInitialQuotes}
          amount={amount}
        />
      </SendPageRow>
      <QuoteCard />
      {showHexData ? <SendHexData /> : null}
    </Box>
  );
};
