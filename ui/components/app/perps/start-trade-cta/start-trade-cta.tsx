import React from 'react';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  FontWeight,
  BackgroundColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';

export type StartTradeCtaProps = {
  /** Callback when the CTA is clicked */
  onPress?: () => void;
};

/**
 * StartTradeCta displays a "Start a new trade" call-to-action button
 *
 * @param options0 - Component props
 * @param options0.onPress - Callback when the CTA is clicked
 */
export const StartTradeCta: React.FC<StartTradeCtaProps> = ({ onPress }) => {
  const handleClick = () => {
    onPress?.();
  };

  return (
    <Box
      as="button"
      className="start-trade-cta"
      display={Display.Flex}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={3}
      paddingBottom={3}
      onClick={handleClick}
      data-testid="start-new-trade-cta"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          backgroundColor={BackgroundColor.backgroundMuted}
          borderRadius={BorderRadius.full}
          style={{ width: '40px', height: '40px' }}
        >
          <Icon name={IconName.Add} size={IconSize.Sm} />
        </Box>
        <Text
          variant={TextVariant.bodySm}
          fontWeight={FontWeight.Medium}
          marginLeft={3}
        >
          Start a new trade
        </Text>
      </Box>
    </Box>
  );
};

export default StartTradeCta;
