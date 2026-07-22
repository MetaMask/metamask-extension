import React, { useMemo, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  ButtonHero,
  ButtonHeroSize,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  ModalFooter,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import type { CaipAssetType } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { BRIDGE_MM_FEE_RATE } from '@metamask/bridge-controller';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  PopoverPosition,
} from '../../../../../components/component-library';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AvatarGroup } from '../../../../../components/multichain/avatar-group';
import { AvatarType } from '../../../../../components/multichain/avatar-group/avatar-group.types';
// eslint-disable-next-line import-x/no-restricted-paths
import { Tooltip } from '../../../../bridge/layout';
// eslint-disable-next-line import-x/no-restricted-paths
import {
  bpsToPercentage,
  formatCurrencyAmount,
  formatTokenAmount,
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../../../bridge/utils/quote';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { IconColor } from '../../../../../helpers/constants/design-system';
import useBatchSellSubmitQuotes from '../hooks/useBatchSellSubmitQuotes';
import { AssetsReceivedSummaryList } from './assets-received-summary-list';
import { AssetsReceivedTotalAmountsSummary } from './assets-received-total-amounts-summary';

type ReviewAndConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  receivedAsset: BatchSellAsset;
  totalReceivedAmount?: number;
  minimumReceivedAmount?: number;
  totalNetworkFee?: string | null;
  totalNetworkFeeFiat?: string | null;
  totalNetworkFeeAssetSymbol?: string;
  isBatchSellTradeAvailable: boolean;
  totalNetworkFeeAreLoading: boolean;
  totalNetworkFeeHasError: boolean;
  quotesAreLoading: boolean;
};

type YouSellRowProps = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  isExpanded: boolean;
  onToggle: () => void;
};

const YouSellRow = ({
  sendAssetsConfig,
  quotes,
  isExpanded,
  onToggle,
}: YouSellRowProps) => {
  const t = useI18nContext();

  const members = useMemo(
    () =>
      Object.entries(sendAssetsConfig)
        .filter(
          ([assetId, { enabled }]) =>
            enabled && quotes?.[assetId as CaipAssetType]?.hasQuote,
        )
        .map(([, { asset }]) => ({
          avatarValue: asset.iconUrl ?? '',
          symbol: asset.symbol,
        })),
    [sendAssetsConfig, quotes],
  );

  const tokenCount = members.length;

  return (
    <Box
      paddingHorizontal={2}
      paddingVertical={3}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
    >
      <Box className="flex-1">
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {t('youSell')}
        </Text>
      </Box>
      <Box
        asChild
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="cursor-pointer bg-transparent border-0 p-0"
      >
        <button type="button" onClick={onToggle} aria-expanded={isExpanded}>
          <AvatarGroup
            members={members}
            limit={5}
            avatarType={AvatarType.TOKEN}
          />
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t(
              tokenCount > 1
                ? 'batchSellYouSellTokenCountPlural'
                : 'batchSellYouSellTokenCount',
              [tokenCount.toString()],
            )}
          </Text>
          <Icon
            name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
            size={IconSize.Sm}
          />
        </button>
      </Box>
    </Box>
  );
};

type NetworkFeeRowProps = {
  feeAssetSymbol: string;
  totalNetworkFee?: string | null;
  totalNetworkFeeFiat?: string | null;
  error?: boolean;
  loading: boolean;
};

const NetworkFeeRow = ({
  feeAssetSymbol,
  totalNetworkFee,
  totalNetworkFeeFiat,
  error,
  loading,
}: NetworkFeeRowProps) => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const currency = useSelector(getCurrentCurrency);

  // Token amount is only renderable once the gasless batch fetch resolves.
  // Fiat is independent: the bridge controller returns it as `null` when no
  // exchange rate is available for the fee asset, so we render the token
  // amount alone in that case rather than blocking the whole row.
  const hasTokenAmount =
    totalNetworkFee !== undefined && totalNetworkFee !== null;
  const hasFiatAmount =
    totalNetworkFeeFiat !== undefined && totalNetworkFeeFiat !== null;

  const networkFeeTokenAmount = useMemo(() => {
    return hasTokenAmount
      ? formatTokenAmount(
          locale,
          totalNetworkFee,
          feeAssetSymbol,
          BigNumber.ROUND_DOWN,
        )
      : '-'; // renders when network fee is unavailable or due to error
  }, [hasTokenAmount, locale, totalNetworkFee, feeAssetSymbol]);

  const networkFeeFiatAmount = useMemo(() => {
    return hasFiatAmount
      ? formatCurrencyAmount(totalNetworkFeeFiat, currency, 2)
      : '-'; // renders when network fee is unavailable or due to error
  }, [hasFiatAmount, totalNetworkFeeFiat, currency]);

  return (
    <Box>
      <Box
        marginHorizontal={2}
        borderWidth={1}
        borderColor={BoxBorderColor.BorderMuted}
        marginBottom={3}
      />
      <Box
        padding={2}
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <Box
          className="flex-1"
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          alignItems={BoxAlignItems.Center}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={error ? TextColor.ErrorDefault : TextColor.TextAlternative}
          >
            {t('networkFee')}
          </Text>
          <Tooltip
            iconColor={
              error ? IconColor.errorDefault : IconColor.iconAlternative
            }
            position={PopoverPosition.Bottom}
            style={{ zIndex: 1051 }}
          >
            {t('batchSellNetworkFeeTooltip')}
          </Tooltip>
        </Box>
        <Skeleton isLoading={loading} width={120}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={2}
            alignItems={BoxAlignItems.Center}
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={error ? TextColor.ErrorDefault : TextColor.TextAlternative}
            >
              {networkFeeTokenAmount}
            </Text>
            {hasFiatAmount && (
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={error ? TextColor.ErrorDefault : TextColor.TextDefault}
              >
                {networkFeeFiatAmount}
              </Text>
            )}
          </Box>
        </Skeleton>
      </Box>
    </Box>
  );
};

export const ReviewAndConfirmModal = ({
  open,
  onClose,
  sendAssetsConfig,
  quotes,
  receivedAsset,
  totalReceivedAmount,
  minimumReceivedAmount,
  totalNetworkFee,
  totalNetworkFeeFiat,
  totalNetworkFeeAssetSymbol,
  isBatchSellTradeAvailable,
  totalNetworkFeeAreLoading,
  totalNetworkFeeHasError,
  quotesAreLoading,
}: ReviewAndConfirmModalProps) => {
  const t = useI18nContext();
  const [isYouSellExpanded, setIsYouSellExpanded] = useState(false);
  const quoteResponses = useMemo(
    () =>
      Object.entries(sendAssetsConfig)
        .filter(([, config]) => config.enabled)
        .map(([assetId]) => quotes?.[assetId as CaipAssetType]?.quote ?? null),
    [quotes, sendAssetsConfig],
  );
  const { submitBatchSellQuotes, isSubmitting } = useBatchSellSubmitQuotes({
    quoteResponses,
    receivedAsset,
  });
  const submitLabel =
    isBatchSellTradeAvailable || totalNetworkFeeAreLoading || quotesAreLoading
      ? t('sellAll')
      : t('alertReasonInsufficientBalance');

  // All quotes in a batch share the same MM fee rate, so we read it from the
  // first quote that has one and fall back to the bridge default. Mirrors the
  // pattern used by `BridgeCTAInfoText`.
  const feePercentage = useMemo(() => {
    const quoteBpsFee = Object.values(quotes ?? {}).find(
      (q) => q.quoteBpsFee !== undefined,
    )?.quoteBpsFee;
    return bpsToPercentage(quoteBpsFee) ?? BRIDGE_MM_FEE_RATE;
  }, [quotes]);

  return (
    <Modal
      isOpen={open}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      onClose={() => {
        setIsYouSellExpanded(false);
        onClose();
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Text textAlign={TextAlign.Center} variant={TextVariant.HeadingSm}>
            {t('review')}
          </Text>
        </ModalHeader>
        <ModalBody>
          <YouSellRow
            sendAssetsConfig={sendAssetsConfig}
            quotes={quotes}
            isExpanded={isYouSellExpanded}
            onToggle={() => setIsYouSellExpanded((prev) => !prev)}
          />
          {isYouSellExpanded && (
            <AssetsReceivedSummaryList
              receivedAsset={receivedAsset}
              sendAssetsConfig={sendAssetsConfig}
              quotes={quotes}
            />
          )}
          <AssetsReceivedTotalAmountsSummary
            receivedAsset={receivedAsset}
            totalReceivedAmount={totalReceivedAmount}
            minimumReceivedAmount={minimumReceivedAmount}
            isLoading={minimumReceivedAmount === undefined}
          />
          <NetworkFeeRow
            loading={totalNetworkFeeAreLoading}
            feeAssetSymbol={totalNetworkFeeAssetSymbol ?? receivedAsset.symbol}
            totalNetworkFee={totalNetworkFee}
            totalNetworkFeeFiat={totalNetworkFeeFiat}
            error={totalNetworkFeeHasError}
          />
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2">
          <ButtonHero
            isFullWidth
            size={ButtonHeroSize.Lg}
            disabled={!isBatchSellTradeAvailable}
            isLoading={isSubmitting}
            onClick={submitBatchSellQuotes}
          >
            <Text
              variant={TextVariant.ButtonLabelMd}
              fontWeight={FontWeight.Medium}
              textAlign={TextAlign.Center}
              color={TextColor.PrimaryInverse}
            >
              {submitLabel}
            </Text>
          </ButtonHero>
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
          >
            {t('rateIncludesMMFee', [feePercentage])}
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
