import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  AvatarTokenSize,
  Button,
  ButtonVariant,
  ButtonSize,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getCurrentLocale } from '../../../../ducks/locale/locale';
import {
  formatPerpsFiatMinimal,
  formatPerpsFiatUniversal,
} from '../utils/formatPerpsDisplayPrice';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import {
  usePerpsEligibility,
  usePerpsEventTracking,
} from '../../../../hooks/perps';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName, formatOrderType } from '../utils';
import { PERPS_TOAST_KEYS, usePerpsToast } from '../perps-toast';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import type { Order } from '../types';

export type CancelOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
};

/**
 * CancelOrderModal component displays order details and a cancel action.
 *
 * @param options0 - Component props
 * @param options0.isOpen - Whether the modal is visible
 * @param options0.onClose - Callback to close the modal
 * @param options0.order - The order to display and potentially cancel
 */
export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const t = useI18nContext();
  const currentLocale = useSelector(getCurrentLocale);
  const { replacePerpsToastByKey } = usePerpsToast();
  const { isEligible } = usePerpsEligibility();
  const { track } = usePerpsEventTracking();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setError(null);
      setIsGeoBlockModalOpen(false);
    }
  }, [isOpen]);

  const displayName = getDisplayName(order.symbol);
  const isBuy = order.side === 'buy';

  const formattedDate = useMemo(() => {
    const date = new Date(order.timestamp);
    return date.toLocaleString(currentLocale ?? 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [order.timestamp, currentLocale]);

  const formattedPrice = useMemo(() => {
    const price = parseFloat(order.price) || 0;
    return formatPerpsFiatUniversal(price);
  }, [order.price]);

  const orderValueUsd = useMemo(() => {
    const size = parseFloat(order.size) || 0;
    const price = parseFloat(order.price) || 0;
    if (size > 0 && price > 0) {
      return formatPerpsFiatMinimal(size * price);
    }
    return null;
  }, [order.size, order.price]);

  const modalTitle = useMemo(() => {
    const orderTypeLabel = formatOrderType(order.orderType);
    const directionLabel = isBuy ? t('perpsLong') : t('perpsShort');
    return `${orderTypeLabel} ${directionLabel.toLowerCase()}`;
  }, [order.orderType, isBuy, t]);

  const handleCancel = useCallback(async () => {
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitRequestToBackground<{
        success: boolean;
        error?: string;
      }>('perpsCancelOrder', [
        { orderId: order.orderId, symbol: order.symbol },
      ]);
      if (!result?.success) {
        throw new Error(result?.error ?? t('somethingWentWrong'));
      }
      track(MetaMetricsEventName.PerpsOrderCancelTransaction, {
        [PERPS_EVENT_PROPERTY.ASSET]: order.symbol,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
        [PERPS_EVENT_PROPERTY.ORDER_TYPE]: order.orderType,
      });
      replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.CANCEL_ORDER_SUCCESS });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('somethingWentWrong');
      track(MetaMetricsEventName.PerpsOrderCancelTransaction, {
        [PERPS_EVENT_PROPERTY.ASSET]: order.symbol,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errorMessage,
      });
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errorMessage,
      });
      setError(errorMessage);
      replacePerpsToastByKey({
        key: PERPS_TOAST_KEYS.CANCEL_ORDER_FAILED,
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  }, [
    isEligible,
    order.orderId,
    order.symbol,
    order.orderType,
    onClose,
    replacePerpsToastByKey,
    track,
    t,
  ]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        data-testid="perps-cancel-order-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <ModalHeader onClose={onClose}>{modalTitle}</ModalHeader>
          <ModalBody>
            <Box flexDirection={BoxFlexDirection.Column} gap={4}>
              {/* Token Logo + Name */}
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Center}
                gap={2}
              >
                <PerpsTokenLogo
                  symbol={order.symbol}
                  size={AvatarTokenSize.Lg}
                />
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {displayName}
                </Text>
              </Box>

              {/* Order Details Rows */}
              <Box flexDirection={BoxFlexDirection.Column} gap={3}>
                {/* Date */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsOrderDate')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {formattedDate}
                  </Text>
                </Box>

                {/* Price */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsLimitPrice')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {formattedPrice}
                  </Text>
                </Box>

                {/* Size */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsSize')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {order.size} {displayName}
                  </Text>
                </Box>

                {/* Original Size */}
                {order.originalSize && order.originalSize !== order.size && (
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    justifyContent={BoxJustifyContent.Between}
                    alignItems={BoxAlignItems.Center}
                  >
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsOrderOriginalSize')}
                    </Text>
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                    >
                      {order.originalSize} {displayName}
                    </Text>
                  </Box>
                )}

                {/* Order Value */}
                {orderValueUsd && (
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    justifyContent={BoxJustifyContent.Between}
                    alignItems={BoxAlignItems.Center}
                  >
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t('perpsOrderValue')}
                    </Text>
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                    >
                      {orderValueUsd}
                    </Text>
                  </Box>
                )}

                {/* Reduce Only */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsReduceOnly')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {order.reduceOnly ? t('yes') : t('no')}
                  </Text>
                </Box>

                {/* Status */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsOrderStatus')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </Text>
                </Box>
              </Box>

              {/* Error */}
              {error && (
                <Box
                  backgroundColor={BoxBackgroundColor.ErrorMuted}
                  className="rounded-lg"
                  padding={3}
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={2}
                >
                  <Icon
                    name={IconName.Warning}
                    size={IconSize.Sm}
                    color={IconColor.ErrorDefault}
                  />
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.ErrorDefault}
                  >
                    {error}
                  </Text>
                </Box>
              )}

              {/* Cancel Button */}
              <Button
                variant={ButtonVariant.Tertiary}
                size={ButtonSize.Lg}
                isFullWidth
                isDanger
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={handleCancel}
                data-testid="perps-cancel-order-button"
              >
                {t('perpsCancelOrder')}
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </>
  );
};

export default CancelOrderModal;
