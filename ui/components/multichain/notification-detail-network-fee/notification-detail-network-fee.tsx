import React, { useState } from 'react';
import type { FC } from 'react';

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

export interface NotificationDetailNetworkFeeProps {
  networkFee: string;
  gasLimit: string;
  gasUsed: string;
  baseFee: string;
  priorityFee: string;
  maxFee: string;
}

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
 * @param props.networkFee - The network fee.
 * @param props.gasLimit - The gas limit.
 * @param props.gasUsed - The gas used.
 * @param props.baseFee - The base fee.
 * @param props.priorityFee - The priority fee.
 * @param props.maxFee - The max fee.
 * @returns The NotificationDetailNetworkFee component.
 */
export const NotificationDetailNetworkFee: FC<
  NotificationDetailNetworkFeeProps
> = ({
  networkFee,
  gasLimit,
  gasUsed,
  baseFee,
  priorityFee,
  maxFee,
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const handleClick = () => {
    setIsOpen(!isOpen);
  };
  return (
    <Box
      as="button"
      onClick={handleClick}
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
            Network Fee
          </Text>
        }
        secondaryTextLeft={
          <Text
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Normal}
            color={TextColor.textAlternative}
          >
            {networkFee}
          </Text>
        }
        secondaryTextRight={
          <Box
            padding-paddingLeft={0}
            paddingRight={0}
            paddingTop={0}
            backgroundColor={BackgroundColor.transparent}
            display={Display.InlineFlex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.flexEnd}
            gap={2}
          >
            <Text color={TextColor.primaryDefault} variant={TextVariant.bodyMd}>
              Details
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
          <FeeDetail label="Gas limit (units)" value={gasLimit} />
          <FeeDetail label="Gas used (units)" value={gasUsed} />
          <FeeDetail label="Base fee (GWEI)" value={baseFee} />
          <FeeDetail label="Priority fee (GWEI)" value={priorityFee} />
          <FeeDetail label="Max fee per gas" value={maxFee} />
        </Box>
      )}
    </Box>
  );
};
