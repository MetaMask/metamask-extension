import React from 'react';
import classnames from 'classnames';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { type GasOption, type GasOptionTooltipProps } from '../../types/gas';
import Tooltip from '../../../../components/ui/tooltip';
import EditGasToolTip from '../edit-gas-fee-popover/edit-gas-tooltip/edit-gas-tooltip';

const SelectedIndicator = () => {
  return (
    <Box
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.primaryDefault}
      className="gas-fee-token-list-item__selected-indicator"
    />
  );
};

const ListItem = ({
  icon,
  name,
  isSelected,
  time,
  fee,
  feeInFiat,
  onClick,
  tooltipProps,
}: {
  icon: React.ReactNode;
  name: string;
  isSelected?: boolean;
  time?: string;
  fee: string;
  feeInFiat?: string;
  onClick?: () => void;
  tooltipProps?: GasOptionTooltipProps;
}) => {
  const t = useI18nContext();

  return (
    <Box
      data-testid={`gas-option-${name}`}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      backgroundColor={isSelected ? BackgroundColor.primaryMuted : undefined}
      padding={2}
      paddingTop={4}
      paddingBottom={4}
      className={classnames('gas-fee-token-list-item', {
        'gas-fee-token-list-item--selected': isSelected ?? false,
      })}
      onClick={() => onClick?.()}
    >
      {isSelected && <SelectedIndicator />}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        paddingLeft={2}
        gap={4}
        style={{ flex: 1 }}
      >
        {icon}
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Text variant={TextVariant.bodyMdMedium}>{name}</Text>
          <Text
            variant={TextVariant.bodySmMedium}
            color={
              isSelected ? TextColor.primaryDefault : TextColor.textAlternative
            }
          >
            {time}
          </Text>
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          textAlign={TextAlign.Right}
        >
          <Text variant={TextVariant.bodyMdMedium}>{feeInFiat}</Text>
          <Text
            variant={TextVariant.bodySmMedium}
            color={TextColor.textAlternative}
          >
            {fee}
          </Text>
        </Box>
        {tooltipProps && (
          <Tooltip
            interactive
            position="top"
            style={{ maxWidth: 240 }}
            html={
              <EditGasToolTip
                t={t as (...args: unknown[]) => string}
                priorityLevel={tooltipProps.priorityLevel}
                maxFeePerGas={tooltipProps.maxFeePerGas}
                maxPriorityFeePerGas={tooltipProps.maxPriorityFeePerGas}
                gasLimit={tooltipProps.gasLimit}
                transaction={tooltipProps.transaction}
              />
            }
          >
            <Icon
              name={IconName.Info}
              size={IconSize.Sm}
              color={IconColor.iconAlternative}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export const GasEstimateListHeader = () => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      padding={2}
      paddingTop={2}
      paddingBottom={2}
    >
      <Box paddingLeft={2} style={{ flex: 1 }}>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {t('gasOption')}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Right}
        >
          {t('maxFee')}
        </Text>
        {/* Spacer for info icon alignment */}
        <Box style={{ width: 16 }} />
      </Box>
    </Box>
  );
};

export const GasEstimateListItem = ({ option }: { option: GasOption }) => {
  const {
    emoji,
    estimatedTime,
    isSelected,
    name,
    onSelect,
    value,
    valueInFiat,
    tooltipProps,
  } = option;

  return (
    <ListItem
      icon={<Text variant={TextVariant.bodyMd}>{emoji}</Text>}
      name={name}
      isSelected={isSelected}
      time={estimatedTime}
      fee={value}
      feeInFiat={valueInFiat}
      onClick={onSelect}
      tooltipProps={tooltipProps}
    />
  );
};
