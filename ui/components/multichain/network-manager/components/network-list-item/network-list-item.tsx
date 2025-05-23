import React, { memo } from 'react';
import {
  AlignItems,
  BorderRadius,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  ButtonIcon,
  ButtonIconSize,
  Checkbox,
  IconName,
} from '../../../../component-library';
import { Box } from '../../../../component-library/box';
import { Skeleton } from '../../../../component-library/skeleton';
import { Text } from '../../../../component-library/text';

export type NetworkListItemProps = {
  /**
   * The name of the network
   */
  name: string;
  /**
   * Source URL for the network icon
   */
  src: string;
  /**
   * Balance amount to display (shows loading skeleton if not provided)
   */
  balance?: string;
  /**
   * Whether the network is selected
   */
  isChecked?: boolean;
  /**
   * Callback for checkbox change event
   */
  onCheckboxChange?: () => void;
  /**
   * Callback for more options button click
   */
  onMoreOptionsClick?: () => void;
};

/**
 * NetworkListItem component
 *
 * Displays a network item with icon, name, balance, and selection controls.
 * Shows a loading skeleton for the balance when data is not yet available.
 *
 * @param props - Component props
 * @returns NetworkListItem component
 */
export const NetworkListItem = memo(
  ({
    name,
    src,
    balance,
    isChecked,
    onCheckboxChange,
    onMoreOptionsClick,
  }: NetworkListItemProps) => {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        paddingTop={4}
        paddingBottom={4}
      >
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
          <Box className="network-manager__networks-button-icon">
            <Checkbox
              label=""
              onChange={onCheckboxChange}
              isChecked={isChecked}
            />
          </Box>
          <AvatarNetwork
            name={name}
            size={AvatarNetworkSize.Md}
            src={src}
            borderRadius={BorderRadius.full}
          />
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {name}
          </Text>
        </Box>
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
          {balance ? (
            <>
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textDefault}
              >
                {balance}
              </Text>
              <ButtonIcon
                size={ButtonIconSize.Lg}
                iconName={IconName.MoreVertical}
                ariaLabel="More options"
                onClick={onMoreOptionsClick}
              />
            </>
          ) : (
            <Skeleton
              className="skeleton"
              width={100}
              height={20}
              style={{ zIndex: 1 }}
            />
          )}
        </Box>
      </Box>
    );
  },
);
