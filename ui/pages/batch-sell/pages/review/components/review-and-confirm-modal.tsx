import React, { useMemo, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  Button,
  ButtonHero,
  ButtonHeroSize,
  ButtonSize,
  ButtonVariant,
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
import { Tooltip } from '../../../../bridge/layout';
import {
  formatCurrencyAmount,
  formatTokenAmount,
} from '../../../../bridge/utils/quote';
import { bpsToPercentage } from '../../../../../ducks/bridge/utils';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { IconColor } from '../../../../../helpers/constants/design-system';
import { AssetsReceivedSummaryList } from './assets-received-list-item';
import { AssetsReceivedTotalAmountsSummary } from './assets-received-total-amounts-summary';

type ReviewAndConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  receivedAsset: {
    symbol: string;
  };
  totalReceivedAmount?: number;
  minimumReceivedAmount?: number;
  totalNetworkFee?: number;
  totalNetworkFeeFiat?: number;
  isInsufficientGasForFee: boolean;
};

type YouSellRowProps = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  isExpanded: boolean;
  onToggle: () => void;
};

const YouSellRow = ({
  sendAssetsConfig,
  isExpanded,
  onToggle,
}: YouSellRowProps) => {
  const t = useI18nContext();

  const members = useMemo(
    () =>
      Object.values(sendAssetsConfig).map(({ asset }) => ({
        avatarValue: asset.iconUrl ?? '',
        symbol: asset.symbol,
      })),
    [sendAssetsConfig],
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
            {t('batchSellYouSellTokenCount', [tokenCount.toString()])}
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
  receivedAsset: {
    symbol: string;
  };
  totalNetworkFee?: number;
  totalNetworkFeeFiat?: number;
  error?: boolean;
};

const NetworkFeeRow = ({
  receivedAsset,
  totalNetworkFee,
  totalNetworkFeeFiat,
  error,
}: NetworkFeeRowProps) => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const currency = useSelector(getCurrentCurrency);

  const networkFeeTokenAmount = useMemo(
    () =>
      formatTokenAmount(
        locale,
        (totalNetworkFee ?? 0).toString(),
        receivedAsset.symbol,
        BigNumber.ROUND_DOWN,
      ),
    [locale, totalNetworkFee, receivedAsset.symbol],
  );

  const networkFeeFiatAmount = useMemo(
    () =>
      formatCurrencyAmount((totalNetworkFeeFiat ?? 0).toString(), currency, 2),
    [totalNetworkFeeFiat, currency],
  );

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
        <Skeleton
          isLoading={
            totalNetworkFee === undefined || totalNetworkFeeFiat === undefined
          }
          width={120}
        >
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
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={error ? TextColor.ErrorDefault : TextColor.TextDefault}
            >
              {networkFeeFiatAmount}
            </Text>
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
  isInsufficientGasForFee,
}: ReviewAndConfirmModalProps) => {
  const t = useI18nContext();
  const [isYouSellExpanded, setIsYouSellExpanded] = useState(false);
  const submitLabel = isInsufficientGasForFee
    ? t('alertReasonInsufficientBalance')
    : t('submit');

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
      onClose={onClose}
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
          />
          <NetworkFeeRow
            receivedAsset={receivedAsset}
            totalNetworkFee={totalNetworkFee}
            totalNetworkFeeFiat={totalNetworkFeeFiat}
            error={isInsufficientGasForFee}
          />
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2">
          <ButtonHero
            isFullWidth
            size={ButtonHeroSize.Lg}
            disabled={isInsufficientGasForFee}
            onClick={console.log}
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
