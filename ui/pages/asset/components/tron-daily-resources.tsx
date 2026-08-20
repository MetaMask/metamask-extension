import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTronResources, TronResource } from '../hooks/useTronResources';

type TronDailyResourcesProps = {
  account: InternalAccount;
  chainId: string;
  t: ReturnType<typeof useI18nContext>;
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
        className="flex"
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        backgroundColor={BoxBackgroundColor.BackgroundAlternative}
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
          color={IconColor.IconDefault}
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
  maxValue: string;
  testId: string;
  descriptionTestId: string;
};

const ResourceRow = ({
  resource,
  iconName,
  label,
  description,
  currentValue,
  maxValue,
  testId,
  descriptionTestId,
}: ResourceRowProps) => {
  return (
    <Box
      className="flex"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      marginTop={3}
      data-testid={testId}
    >
      <Box
        className="flex"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={4}
      >
        <ResourceCircle resource={resource} iconName={iconName} />
        <Box className="flex" flexDirection={BoxFlexDirection.Column} gap={1}>
          <Text
            variant={TextVariant.BodyLg}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {label}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            data-testid={descriptionTestId}
          >
            {description}
          </Text>
        </Box>
      </Box>
      <Box className="flex" flexDirection={BoxFlexDirection.Row}>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
          {currentValue}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          /{maxValue}
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Component to display Tron daily resources (energy and bandwidth)
 * with circular progress indicators
 *
 * @param options0
 * @param options0.account
 * @param options0.chainId
 * @param options0.t
 */
export const TronDailyResources = ({
  account,
  chainId,
  t,
}: TronDailyResourcesProps) => {
  const { energy, bandwidth } = useTronResources(account, chainId);

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
      className="flex"
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={1}
      paddingBottom={3}
      data-testid="tron-daily-resources"
    >
      <Box
        className="flex"
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        marginBottom={3}
      >
        <Text
          variant={TextVariant.HeadingSm}
          color={TextColor.TextDefault}
          data-testid="tron-daily-resources-title"
        >
          {t('tronDailyResources')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          data-testid="tron-daily-resources-description"
        >
          {t('tronDailyResourcesDescription', [formatValue(bandwidth.max)])}
        </Text>
      </Box>

      <ResourceRow
        resource={energy}
        iconName={IconName.Flash}
        label={t('tronEnergy')}
        description={
          usdtTransfersCovered === 1
            ? t('tronEnergyCoverageDescriptionSingular')
            : t('tronEnergyCoverageDescriptionPlural', [
                usdtTransfersCovered.toString(),
              ])
        }
        currentValue={formatValue(energy.current)}
        maxValue={formatValue(energy.max)}
        testId="tron-daily-resources-energy"
        descriptionTestId="tron-daily-resources-energy-description"
      />

      <ResourceRow
        resource={bandwidth}
        iconName={IconName.Connect}
        label={t('tronBandwidth')}
        description={
          trxTransfersCovered === 1
            ? t('tronBandwidthCoverageDescriptionSingular')
            : t('tronBandwidthCoverageDescriptionPlural', [
                trxTransfersCovered.toString(),
              ])
        }
        currentValue={formatValue(bandwidth.current)}
        maxValue={formatValue(bandwidth.max)}
        testId="tron-daily-resources-bandwidth"
        descriptionTestId="tron-daily-resources-bandwidth-description"
      />
    </Box>
  );
};
