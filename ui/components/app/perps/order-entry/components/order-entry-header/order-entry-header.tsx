import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getChangeColor } from '../../../utils';

export type OrderEntryHeaderProps = {
  displayName: string;
  displayPrice: string;
  displayChange?: string;
  onBack: () => void;
  testIdPrefix?: string;
  rightAccessory?: React.ReactNode;
};

/**
 * Shared market header for perps order-entry flows.
 *
 * @param props - Component props.
 * @param props.displayName - Market display symbol.
 * @param props.displayPrice - Formatted current market price.
 * @param props.displayChange - Formatted 24-hour price change.
 * @param props.onBack - Called when the back control is selected.
 * @param props.testIdPrefix - Prefix used for test identifiers.
 * @param props.rightAccessory - Optional trailing controls (e.g. order-book
 * and chart toggles). Falls back to an empty flexible column that keeps the
 * title exactly centered.
 */
export const OrderEntryHeader = ({
  displayName,
  displayPrice,
  displayChange,
  onBack,
  testIdPrefix = 'perps-order-entry',
  rightAccessory,
}: OrderEntryHeaderProps) => {
  const t = useI18nContext();

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      paddingBottom={4}
      className="grid grid-cols-[1fr_auto_1fr]"
    >
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Md}
        color={IconColor.IconAlternative}
        data-testid={`${testIdPrefix}-back-button`}
        onClick={onBack}
        className="w-9 h-9 shrink-0 justify-self-start"
      />
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className="min-w-0"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Bold}
          color={TextColor.TextDefault}
          data-testid={`${testIdPrefix}-asset-symbol`}
        >
          {displayName}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Baseline}
          gap={1}
        >
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            data-testid={`${testIdPrefix}-price`}
          >
            {displayPrice}
          </Text>
          {displayChange ? (
            <Text
              variant={TextVariant.BodySm}
              color={getChangeColor(displayChange)}
              data-testid={`${testIdPrefix}-change`}
            >
              {displayChange}
            </Text>
          ) : null}
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.End}
        gap={1}
        className="min-w-0 justify-self-end"
        data-testid={`${testIdPrefix}-right-accessory`}
      >
        {rightAccessory}
      </Box>
    </Box>
  );
};
