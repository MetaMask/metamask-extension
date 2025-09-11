import React, {
  useCallback,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useMemo,
  ///: END:ONLY_INCLUDE_IF
  useRef,
  useEffect,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { TokenListMap } from '@metamask/assets-controllers';
///: END:ONLY_INCLUDE_IF
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Text,
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
  getRecipient,
} from '../../../../../ducks/send';
import { getTransactions } from '../../../../../selectors/transactions';
import { getInternalAccounts } from '../../../../../selectors/accounts';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../../helpers/constants/common';
import {
  Display,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
import useGetAssetImageUrl from '../../../../../hooks/useGetAssetImageUrl';
///: END:ONLY_INCLUDE_IF
import {
  getAddressPoisoningDetectionEnabled,
  checkForAddressPoisoning,
} from '../../../../../ducks/domains';

import type { Quote } from '../../../../../ducks/send/swap-and-send-utils';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { AssetPicker } from '../../../asset-picker-amount/asset-picker';
import { TabName } from '../../../asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
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
  const dispatch = useDispatch();

  const {
    receiveAsset,
    sendAsset,
    amount: sendAmount,
    isSwapQuoteLoading,
  } = useSelector(getCurrentDraftTransaction);

  // Get the recipient address to check for address poisoning
  const recipient = useSelector(getRecipient);
  const addressPoisoningDetectionEnabled = useSelector(
    getAddressPoisoningDetectionEnabled,
  );
  const [addressPoisoningWarning, setAddressPoisoningWarning] = React.useState<{
    warning: string;
    message: string;
    similarAddress: string;
  } | null>(null);

  // Get transaction history from selector instead of localStorage
  const transactions = useSelector(getTransactions);
  // Get the user's own accounts to check if sending to self
  const internalAccounts = useSelector(getInternalAccounts);

  // Check for address poisoning when the recipient address changes
  useEffect(() => {
    if (recipient.address && addressPoisoningDetectionEnabled) {
      const warning = checkForAddressPoisoning(
        recipient.address,
        addressPoisoningDetectionEnabled,
        transactions,
        internalAccounts,
      );
      setAddressPoisoningWarning(warning);
    } else {
      setAddressPoisoningWarning(null);
    }
  }, [
    recipient.address,
    addressPoisoningDetectionEnabled,
    transactions,
    internalAccounts,
  ]);

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

      {/* Display address poisoning warning if detected */}
      {addressPoisoningWarning ? (
        <SendPageRow>
          <BannerAlert
            severity={BannerAlertSeverity.Warning}
            data-testid="address-poisoning-warning"
          >
            <Text variant={TextVariant.bodyMdBold} marginBottom={2}>
              {addressPoisoningWarning.warning}
            </Text>
            <Text marginBottom={2}>{addressPoisoningWarning.message}</Text>
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
