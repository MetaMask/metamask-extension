import React, { useState, useCallback, memo } from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { Box } from '../../../../component-library/box';
import { Text } from '../../../../component-library/text';

type TotalBalanceProps = {
  /**
   * The total balance amount to display
   */
  totalAmount?: string;
  /**
   * Number of networks loaded out of total networks
   */
  networksLoaded?: number;
  /**
   * Total number of networks
   */
  totalNetworks?: number;
};

/**
 * TotalBalance component
 *
 * Displays the total balance amount across networks with a loading indicator.
 * Shows how many networks have been loaded out of the total networks.
 * Includes a hover tooltip with network loading information.
 *
 * @param props - Component props
 * @returns TotalBalance component
 */
export const TotalBalance = memo(
  ({
    totalAmount = '$12.00',
    networksLoaded = 1,
    totalNetworks = 8,
  }: TotalBalanceProps) => {
    const t = useI18nContext();
    const [isOpen, setIsOpen] = useState(false);
    const [referenceElement, setReferenceElement] = useState();

    const handleMouseEnter = useCallback(() => {
      setIsOpen(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsOpen(false);
    }, []);

    const setBoxRef = useCallback((ref: any) => {
      setReferenceElement(ref);
    }, []);

    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Row}
        gap={3}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
        }}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
        >
          {t('total')} {totalAmount}
        </Text>
        <Box onMouseEnter={handleMouseEnter} ref={setBoxRef}>
          <Icon name={IconName.Refresh} size={IconSize.Sm} />
        </Box>
        <Popover
          hasArrow
          isOpen={isOpen}
          position={PopoverPosition.BottomEnd}
          style={{ zIndex: 100, width: '200px' }}
          arrowProps={{
            style: {
              right: -10,
              // position: 'absolute',
            },
          }}
          referenceElement={referenceElement}
        >
          {networksLoaded} {t('ofNetworksLoaded', [totalNetworks])}
        </Popover>
      </Box>
    );
  },
);
