import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTronResources, TronResource } from '../hooks/useTronResources';

type TronDailyResourcesProps = {
  account: InternalAccount;
  chainId: string;
};

type ResourceCircleProps = {
  resource: TronResource;
  iconName: IconName;
};

const ResourceCircle = ({ resource, iconName }: ResourceCircleProps) => {
  const percentage = Math.min(resource.percentage, 100);
  const radius = 26;
  const strokeWidth = 3;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Box
      style={{
        position: 'relative',
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
    >
      <svg
        height={radius * 2}
        width={radius * 2}
        style={{
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Background circle */}
        <circle
          stroke="var(--color-border-muted)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke="var(--color-primary-default)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease',
            strokeLinecap: 'round',
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {/* Icon in the center */}
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundAlternative}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${radius * 2 - strokeWidth * 4}px`,
          height: `${radius * 2 - strokeWidth * 4}px`,
          borderRadius: '50%',
        }}
      >
        <Icon
          name={iconName}
          color={IconColor.iconDefault}
          size={IconSize.Sm}
        />
      </Box>
    </Box>
  );
};

type ResourceRowProps = {
  resource: TronResource;
  iconName: IconName;
  label: string;
  description: string;
  currentValue: string;
};

const ResourceRow = ({
  resource,
  iconName,
  label,
  description,
  currentValue,
}: ResourceRowProps) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={3}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={4}
      >
        <ResourceCircle resource={resource} iconName={iconName} />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={1}
        >
          <Text
            variant={TextVariant.bodyLgMedium}
            color={TextColor.textDefault}
          >
            {label}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {description}
          </Text>
        </Box>
      </Box>
      <Text variant={TextVariant.bodyLgMedium} color={TextColor.textDefault}>
        {currentValue}
      </Text>
    </Box>
  );
};

/**
 * Component to display Tron daily resources (energy and bandwidth)
 * with circular progress indicators
 */
export const TronDailyResources = ({
  account,
  chainId,
}: TronDailyResourcesProps) => {
  const t = useI18nContext();
  const { energy, bandwidth, isLoading } = useTronResources(account, chainId);

  // Don't render if still loading
  if (isLoading) {
    return null;
  }

  // Constants for resource calculations
  const ENERGY_PER_TRC20_TRANSFER_BASELINE = 65000;
  const BANDWIDTH_PER_TRX_TRANSFER_BASELINE = 280;

  // Calculate how many transfers can be covered
  const usdtTransfersCovered = Math.floor(
    energy.current / ENERGY_PER_TRC20_TRANSFER_BASELINE,
  );
  const trxTransfersCovered = Math.floor(
    bandwidth.current / BANDWIDTH_PER_TRX_TRANSFER_BASELINE,
  );

  // Format values for display
  const formatValue = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={1}
      paddingBottom={3}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        marginBottom={3}
      >
        <Text variant={TextVariant.headingSm} color={TextColor.textDefault}>
          {t('tronDailyResources')}
        </Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {t('tronDailyResourcesDescription')}
        </Text>
      </Box>

      <ResourceRow
        resource={energy}
        iconName={IconName.Flash}
        label={t('tronEnergy')}
        description={t('tronEnergyCoverageDescription', [
          usdtTransfersCovered.toString(),
        ])}
        currentValue={formatValue(energy.current)}
      />

      <ResourceRow
        resource={bandwidth}
        iconName={IconName.Connect}
        label={t('tronBandwidth')}
        description={t('tronBandwidthCoverageDescription', [
          trxTransfersCovered.toString(),
        ])}
        currentValue={formatValue(bandwidth.current)}
      />
    </Box>
  );
};
