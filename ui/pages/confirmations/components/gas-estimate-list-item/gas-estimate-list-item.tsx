import React from 'react';
import classnames from 'classnames';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { type GasOption, type GasOptionTooltipProps } from '../../types/gas';
import Tooltip from '../../../../components/ui/tooltip';
import EditGasToolTip from '../edit-gas-fee-popover/edit-gas-tooltip/edit-gas-tooltip';

const SelectedIndicator = () => {
  return (
    <Box
      backgroundColor={BoxBackgroundColor.PrimaryDefault}
      className="gas-fee-token-list-item__selected-indicator rounded-full"
    />
  );
};

const ListItem = ({
  optionKey,
  name,
  isSelected,
  time,
  fee,
  feeInFiat,
  onClick,
  tooltipProps,
}: {
  optionKey: string;
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
      data-testid={`gas-option-${optionKey}`}
      flexDirection={BoxFlexDirection.Row}
      backgroundColor={isSelected ? BoxBackgroundColor.PrimaryMuted : undefined}
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
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={2}
        gap={4}
        style={{ flex: 1 }}
      >
        <Box flexDirection={BoxFlexDirection.Column} marginLeft={2}>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {name}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={
              isSelected ? TextColor.PrimaryDefault : TextColor.TextAlternative
            }
          >
            {time}
          </Text>
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Box flexDirection={BoxFlexDirection.Column}>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Right}
          >
            {feeInFiat}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Right}
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
              color={IconColor.IconAlternative}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export const GasEstimateListItem = ({ option }: { option: GasOption }) => {
  const {
    estimatedTime,
    isSelected,
    key,
    name,
    onSelect,
    value,
    valueInFiat,
    tooltipProps,
  } = option;

  return (
    <ListItem
      optionKey={key}
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
