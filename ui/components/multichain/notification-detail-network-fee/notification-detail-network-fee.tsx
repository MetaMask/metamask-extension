import React, { useContext, useState, useEffect } from 'react';
import type { FC } from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getNetworkFees,
  getNetworkDetailsByChainId,
} from '../../../helpers/utils/notification.util';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import { NotificationDetail } from '../notification-detail';
import {
  AvatarIcon,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FontWeight,
  JustifyContent,
  TextVariant,
  TextColor,
  BlockSize,
  IconColor,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import Preloader from '../../ui/icon/preloader/preloader-icon.component';

type OnChainRawNotificationsWithNetworkFields =
  NotificationServicesController.Types.OnChainRawNotificationsWithNetworkFields;

type NetworkFees = {
  transactionFee: {
    transactionFeeInEther: string;
    transactionFeeInUsd: string;
  };
  gasLimitUnits: number;
  gasUsedUnits: number;
  baseFee: string | null;
  priorityFee: string | null;
  maxFeePerGas: string | null;
} | null;

export type NotificationDetailNetworkFeeProps = {
  notification: OnChainRawNotificationsWithNetworkFields;
};

const FeeDetail = ({ label, value }: { label: string; value: string }) => (
  <Box
    display={Display.Flex}
    justifyContent={JustifyContent.spaceBetween}
    padding={4}
  >
    <Text
      color={TextColor.textDefault}
      variant={TextVariant.bodyMd}
      fontWeight={FontWeight.Normal}
    >
      {label}
    </Text>
    <Text
      color={TextColor.textAlternative}
      variant={TextVariant.bodyMd}
      fontWeight={FontWeight.Normal}
    >
      {value}
    </Text>
  </Box>
);

/**
 * NotificationDetailNetworkFee component displays the network fee details.
 *
 * @param props - The props object.
 * @param props.notification - The notification object.
 * @returns The NotificationDetailNetworkFee component.
 */
export const NotificationDetailNetworkFee: FC<
  NotificationDetailNetworkFeeProps
> = ({ notification }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [networkFees, setNetworkFees] = useState<NetworkFees>(null);
  const [networkFeesError, setNetworkFeesError] = useState<boolean>(false);

  const getNativeCurrency = (n: OnChainRawNotificationsWithNetworkFields) => {
    const chainId = decimalToHex(n.chain_id);
    return getNetworkDetailsByChainId(`0x${chainId}` as keyof typeof CHAIN_IDS);
  };

  const nativeCurrency = getNativeCurrency(notification);

  useEffect(() => {
    const fetchNetworkFees = async () => {
      try {
        const networkFeesData = await getNetworkFees(notification);
        if (networkFeesData) {
          setNetworkFees({
            transactionFee: {
              transactionFeeInEther: networkFeesData.transactionFeeInEth,
              transactionFeeInUsd: networkFeesData.transactionFeeInUsd,
            },
            gasLimitUnits: networkFeesData.gasLimit,
            gasUsedUnits: networkFeesData.gasUsed,
            baseFee: networkFeesData.baseFee,
            priorityFee: networkFeesData.priorityFee,
            maxFeePerGas: networkFeesData.maxFeePerGas,
          });
        }
      } catch (err) {
        setNetworkFeesError(true);
      }
    };
    fetchNetworkFees();
  }, []);

  const handleClick = () => {
    if (!isOpen) {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationInteraction,
        event: MetaMetricsEventName.NotificationDetailClicked,
        properties: {
          notification_id: notification.id,
          notification_type: notification.type,
          chain_id: notification.chain_id,
          clicked_item: 'fee_details',
        },
      });
    }
    setIsOpen(!isOpen);
  };

  if (!networkFees && !networkFeesError) {
    return (
      <Box
        height={BlockSize.Full}
        width={BlockSize.Full}
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
        data-testid="notifications-list-loading"
      >
        <Preloader size={36} />
      </Box>
    );
  }

  if (!networkFees && networkFeesError) {
    return (
      <Box
        height={BlockSize.Full}
        width={BlockSize.Full}
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
        data-testid="notifications-list-loading"
        paddingTop={4}
      >
        <Text
          as="p"
          color={TextColor.errorDefault}
          variant={TextVariant.bodyMd}
        >
          {t('notificationItemError')}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.transparent}
      padding={0}
    >
      <NotificationDetail
        icon={
          <AvatarIcon
            iconName={IconName.Gas}
            color={TextColor.infoDefault}
            backgroundColor={BackgroundColor.infoMuted}
          />
        }
        primaryTextLeft={
          <Text
            variant={TextVariant.bodyLgMedium}
            fontWeight={FontWeight.Medium}
            color={TextColor.textDefault}
          >
            {t('notificationDetailNetworkFee')}
          </Text>
        }
        secondaryTextLeft={
          <Text
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Normal}
            color={TextColor.textAlternative}
          >
            {networkFees?.transactionFee.transactionFeeInEther}{' '}
            {nativeCurrency?.nativeCurrencySymbol} (
            {networkFees?.transactionFee.transactionFeeInUsd} USD)
          </Text>
        }
        secondaryTextRight={
          <Box
            paddingLeft={0}
            paddingRight={0}
            paddingTop={0}
            backgroundColor={BackgroundColor.transparent}
            display={Display.InlineFlex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.flexEnd}
            gap={2}
            as="button"
            onClick={handleClick}
          >
            <Text color={TextColor.primaryDefault} variant={TextVariant.bodyMd}>
              {t('notificationDetail')}
            </Text>
            <Icon
              name={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
              color={IconColor.primaryDefault}
              size={IconSize.Sm}
              marginInlineEnd={1}
            />
          </Box>
        }
      />
      {isOpen && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.flexStart}
          width={BlockSize.Full}
        >
          <FeeDetail
            label={t('notificationDetailGasLimit')}
            value={networkFees?.gasLimitUnits.toString() || ''}
          />
          <FeeDetail
            label={t('notificationDetailGasUsed')}
            value={networkFees?.gasUsedUnits.toString() || ''}
          />
          <FeeDetail
            label={t('notificationDetailBaseFee')}
            value={networkFees?.baseFee || ''}
          />
          <FeeDetail
            label={t('notificationDetailPriorityFee')}
            value={networkFees?.priorityFee || ''}
          />
          <FeeDetail
            label={t('notificationDetailMaxFee')}
            value={networkFees?.maxFeePerGas || ''}
          />
        </Box>
      )}
    </Box>
  );
};
