import React, { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
} from '../../../../component-library';
import {
  Asset,
  acknowledgeRecipientWarning,
  selectRecipientContentData,
} from '../../../../../ducks/send';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import { Display } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AssetPickerAmount } from '../../..';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';

import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { AssetPicker } from '../../../asset-picker-amount/asset-picker';
import { TabName } from '../../../asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { SendPageRow } from './send-page-row';
import { QuoteCard } from './quote-card';
import { SendHexData } from './hex';

export const SendPageRecipientContent = ({
  requireContractAddressAcknowledgement,
  onAssetChange,
  onClick,
}: {
  requireContractAddressAcknowledgement: boolean;
  onAssetChange: (newAsset: Asset, isReceived: boolean) => void;
  onClick: () => React.ComponentProps<typeof AssetPicker>['onClick'];
}) => {
  const t = useI18nContext();

  // Use structured selector to reduce subscriptions from 13 to 1
  const {
    draftTransaction,
    isBasicFunctionality,
    isSwapsChain,
    isSwapAndSendDisabledForNetwork,
    swapsBlockedTokens,
    nativeCurrencySymbol,
    nativeCurrencyImageUrl,
    tokenList,
    ipfsGateway,
    bestQuote,
    showHexDataFlag,
    sendAsset,
  } = useSelector(selectRecipientContentData);

  const {
    receiveAsset,
    sendAsset: draftSendAsset,
    amount: sendAmount,
    isSwapQuoteLoading,
  } = draftTransaction;

  // Use sendAsset from structured selector if available, otherwise use from draftTransaction
  const effectiveSendAsset = sendAsset || draftSendAsset;

  const memoizedSwapsBlockedTokens = useMemo(() => {
    return new Set(swapsBlockedTokens);
  }, [swapsBlockedTokens]);

  const nftImageURL = useGetAssetImageUrl(
    effectiveSendAsset.details?.image ?? undefined,
    ipfsGateway,
  );

  const isSwapAllowed =
    isSwapsChain &&
    !isSwapAndSendDisabledForNetwork &&
    [AssetType.token, AssetType.native].includes(effectiveSendAsset.type) &&
    isBasicFunctionality &&
    !memoizedSwapsBlockedTokens.has(
      effectiveSendAsset.details?.address?.toLowerCase(),
    );

  const isLoadingInitialQuotes = !bestQuote && isSwapQuoteLoading;

  const isBasicSend = isEqualCaseInsensitive(
    receiveAsset.details?.address ?? '',
    effectiveSendAsset.details?.address ?? '',
  );

  const amount = isBasicSend
    ? sendAmount
    : { value: decimalToHex(bestQuote?.destinationAmount || '0') };

  // Hex data
  const showHexData =
    isBasicSend &&
    showHexDataFlag &&
    effectiveSendAsset &&
    effectiveSendAsset.type !== AssetType.token &&
    effectiveSendAsset.type !== AssetType.NFT;

  const scrollRef = useRef<HTMLDivElement>(null);

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
        <AssetPickerAmount
          header={t('sendSelectReceiveAsset')}
          action="receive"
          asset={isSwapAllowed ? receiveAsset : effectiveSendAsset}
          sendingAsset={
            isSwapAllowed &&
            effectiveSendAsset && {
              image:
                effectiveSendAsset.type === AssetType.native
                  ? nativeCurrencyImageUrl
                  : tokenList &&
                    effectiveSendAsset.details &&
                    (nftImageURL ||
                      tokenList[
                        effectiveSendAsset.details.address?.toLowerCase()
                      ]?.iconUrl),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              symbol:
                effectiveSendAsset?.details?.symbol || nativeCurrencySymbol,
            }
          }
          onAssetChange={useCallback(
            (newAsset) => onAssetChange(newAsset, isSwapAllowed),
            [onAssetChange, isSwapAllowed],
          )}
          isAmountLoading={isLoadingInitialQuotes}
          amount={amount}
          isDisabled={!isSwapAllowed}
          onClick={onClick}
          showNetworkPicker={false}
          visibleTabs={[TabName.TOKENS]}
        />
      </SendPageRow>
      <QuoteCard scrollRef={scrollRef} />
      {showHexData ? <SendHexData /> : null}
      {/* SCROLL REF ANCHOR */}
      <div ref={scrollRef} />
    </Box>
  );
};
