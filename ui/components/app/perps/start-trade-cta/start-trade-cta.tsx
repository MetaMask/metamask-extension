import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBackgroundColor,
  Text,
  TextVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  ButtonBase,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

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
  const t = useI18nContext();

  const handleClick = () => {
    onPress?.();
  };

  return (
    <ButtonBase
      className="w-full px-0 h-auto rounded-none bg-transparent hover:bg-hover active:bg-pressed"
      onClick={handleClick}
      data-testid="start-new-trade-cta"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={3}
        paddingBottom={3}
        className="w-full"
      >
        <Box
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          backgroundColor={BoxBackgroundColor.BackgroundMuted}
          className="flex h-10 w-10 rounded-full"
        >
          <Icon name={IconName.Add} size={IconSize.Sm} />
        </Box>
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          className="ml-3"
        >
          {t('perpsStartNewTrade')}
        </Text>
      </Box>
    </ButtonBase>
  );
};

export default StartTradeCta;
