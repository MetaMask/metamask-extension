import React, { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TokenListMap } from '@metamask/assets-controllers';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
} from '../../../../component-library';
import {
  getNativeCurrency,
  getSendHexDataFeatureFlagState,
} from '../../../../../ducks/metamask/metamask';
import {
  Asset,
  acknowledgeRecipientWarning,
  getBestQuote,
  getCurrentDraftTransaction,
  getIsSwapAndSendDisabledForNetwork,
  getSwapsBlockedTokens,
  getSendAsset,
} from '../../../../../ducks/send';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import { Display } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AssetPickerAmount } from '../../..';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';
import {
  getIpfsGateway,
  getIsSwapsChain,
  getNativeCurrencyImage,
  getTokenList,
  getUseExternalServices,
} from '../../../../../selectors';
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';

import type { Quote } from '../../../../../ducks/send/swap-and-send-utils';
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

  const {
    receiveAsset,
    sendAsset,
    amount: sendAmount,
    isSwapQuoteLoading,
  } = useSelector(getCurrentDraftTransaction);

  const isBasicFunctionality = useSelector(getUseExternalServices);
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isSwapAndSendDisabledForNetwork = useSelector(
    getIsSwapAndSendDisabledForNetwork,
  );
  const swapsBlockedTokens = useSelector(getSwapsBlockedTokens);
  const memoizedSwapsBlockedTokens = useMemo(() => {
    return new Set(swapsBlockedTokens);
  }, [swapsBlockedTokens]);

  const nativeCurrencySymbol = useSelector(getNativeCurrency);
  const nativeCurrencyImageUrl = useSelector(getNativeCurrencyImage);
  const tokenList = useSelector(getTokenList) as TokenListMap;
  const ipfsGateway = useSelector(getIpfsGateway);

  const nftImageURL = useGetAssetImageUrl(
    sendAsset.details?.image ?? undefined,
    ipfsGateway,
  );

  const isSwapAllowed =
    isSwapsChain &&
    !isSwapAndSendDisabledForNetwork &&
    [AssetType.token, AssetType.native].includes(sendAsset.type) &&
    isBasicFunctionality &&
    !memoizedSwapsBlockedTokens.has(sendAsset.details?.address?.toLowerCase());

  const bestQuote: Quote = useSelector(getBestQuote);

  const isLoadingInitialQuotes = !bestQuote && isSwapQuoteLoading;

  const isBasicSend = isEqualCaseInsensitive(
    receiveAsset.details?.address ?? '',
    sendAsset.details?.address ?? '',
  );

  const amount = isBasicSend
    ? sendAmount
    : { value: decimalToHex(bestQuote?.destinationAmount || '0') };

  // Hex data
  const showHexDataFlag = useSelector(getSendHexDataFeatureFlagState);
  const asset = useSelector(getSendAsset);
  const showHexData =
    isBasicSend &&
    showHexDataFlag &&
    asset &&
    asset.type !== AssetType.token &&
    asset.type !== AssetType.NFT;

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
          asset={isSwapAllowed ? receiveAsset : sendAsset}
          sendingAsset={
            isSwapAllowed &&
            sendAsset && {
              image:
                sendAsset.type === AssetType.native
                  ? nativeCurrencyImageUrl
                  : tokenList &&
                    sendAsset.details &&
                    (nftImageURL ||
                      tokenList[sendAsset.details.address?.toLowerCase()]
                        ?.iconUrl),
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              symbol: sendAsset?.details?.symbol || nativeCurrencySymbol,
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
