import React, {
  useCallback,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useMemo,
  ///: END:ONLY_INCLUDE_IF
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { TokenListMap } from '@metamask/assets-controllers';
///: END:ONLY_INCLUDE_IF
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
} from '../../../../component-library';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getNativeCurrency,
  ///: END:ONLY_INCLUDE_IF
  getSendHexDataFeatureFlagState,
} from '../../../../../ducks/metamask/metamask';
import {
  Asset,
  acknowledgeRecipientWarning,
  getBestQuote,
  getCurrentDraftTransaction,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getIsSwapAndSendDisabledForNetwork,
  getSwapsBlockedTokens,
  ///: END:ONLY_INCLUDE_IF
  getSendAsset,
} from '../../../../../ducks/send';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import { Display } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AssetPickerAmount } from '../../..';
import { decimalToHex } from '../../../../../../shared/modules/conversion.utils';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import {
  getIpfsGateway,
  getIsSwapsChain,
  getNativeCurrencyImage,
  getTokenList,
  getUseExternalServices,
} from '../../../../../selectors';
///: END:ONLY_INCLUDE_IF

import type { Quote } from '../../../../../ducks/send/swap-and-send-utils';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { AssetPicker } from '../../../asset-picker-amount/asset-picker';
import { TabName } from '../../../asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { getAssetImageURL } from '../../../../../helpers/utils/util';
import { SendHexData, SendPageRow, QuoteCard } from '.';

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

  let isSwapAllowed;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isSwapAllowed = false;
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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

  isSwapAllowed =
    isSwapsChain &&
    !isSwapAndSendDisabledForNetwork &&
    [AssetType.token, AssetType.native].includes(sendAsset.type) &&
    isBasicFunctionality &&
    !memoizedSwapsBlockedTokens.has(sendAsset.details?.address?.toLowerCase());
  ///: END:ONLY_INCLUDE_IF

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
          asset={isSwapAllowed ? receiveAsset : sendAsset}
          sendingAsset={
            isSwapAllowed &&
            sendAsset && {
              image:
                sendAsset.type === AssetType.native
                  ? nativeCurrencyImageUrl
                  : tokenList &&
                    sendAsset.details &&
                    (getAssetImageURL(sendAsset.details?.image, ipfsGateway) ||
                      tokenList[sendAsset.details.address?.toLowerCase()]
                        ?.iconUrl),
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
