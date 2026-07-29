import React from 'react';
import {
  Box,
  BoxAlignItems,
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

import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getChangeColor } from '../../../utils';

export type OrderEntryHeaderProps = {
  displayName: string;
  displayPrice: string;
  displayChange?: string;
  onBack: () => void;
  testIdPrefix?: string;
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
 */
export const OrderEntryHeader = ({
  displayName,
  displayPrice,
  displayChange,
  onBack,
  testIdPrefix = 'perps-order-entry',
}: OrderEntryHeaderProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      paddingBottom={4}
    >
      <Box
        data-testid={`${testIdPrefix}-back-button`}
        onClick={onBack}
        aria-label={t('back')}
        className="w-9 shrink-0 cursor-pointer"
      >
        <Icon
          name={IconName.ArrowLeft}
          size={IconSize.Md}
          color={IconColor.IconAlternative}
        />
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className="flex-1 min-w-0"
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
      <Box className="w-9 shrink-0" aria-hidden="true" />
    </Box>
  );
};
