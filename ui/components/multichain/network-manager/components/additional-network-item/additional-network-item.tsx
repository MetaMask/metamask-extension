import React, { useCallback, memo } from 'react';
import {
  AlignItems,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../component-library';
import { Box } from '../../../../component-library/box';
import { Text } from '../../../../component-library/text';

type AdditionalNetworkItemProps = {
  /**
   * The name of the network
   */
  name: string;
  /**
   * The source URL for the network icon
   */
  src: string;
  /**
   * Function to call when the network item is clicked
   */
  onClick: () => void;
  /**
   * Optional className for styling
   */
  className?: string;
  /**
   * Aria label for the add button
   */
  addButtonAriaLabel?: string;
};

/**
 * AdditionalNetworkItem component
 *
 * Displays a network that can be added with an icon, name, and add button.
 * Used in the Network Manager to show networks that can be added.
 *
 * @param props - Component props
 * @returns AdditionalNetworkItem component
 */
export const AdditionalNetworkItem = memo(
  ({
    name,
    src,
    onClick,
    className,
    addButtonAriaLabel,
  }: AdditionalNetworkItemProps) => {
    const t = useI18nContext();

    const handleClick = useCallback(() => {
      onClick();
    }, [onClick]);

    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        onClick={handleClick}
        paddingTop={4}
        paddingBottom={4}
        className={className}
        data-testid="additional-network-item"
      >
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
          <Box className="additional-network-item__button-icon">
            <ButtonIcon
              size={ButtonIconSize.Lg}
              color={IconColor.iconAlternative}
              iconName={IconName.Add}
              padding={0}
              margin={0}
              ariaLabel={addButtonAriaLabel || t('addNetwork')}
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
      </Box>
    );
  },
);
