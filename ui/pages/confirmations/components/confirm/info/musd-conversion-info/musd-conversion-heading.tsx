import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  TextAlign,
} from '@metamask/design-system-react';
import {
  Popover,
  PopoverPosition,
} from '../../../../../../components/component-library';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../../../../components/app/musd/constants';

/**
 * MusdConversionHeading Component
 *
 * Displays the heading for the mUSD conversion confirmation screen.
 * Shows "Convert and get 3%" with an info button that opens a tooltip
 * explaining the bonus.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversionNavbar.tsx
 */
export const MusdConversionHeading: React.FC = () => {
  const t = useI18nContext();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleInfoClick = useCallback(() => {
    setIsTooltipOpen((prev) => !prev);
  }, []);

  const handleCloseTooltip = useCallback(() => {
    setIsTooltipOpen(false);
  }, []);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      paddingTop={4}
      paddingBottom={2}
      style={{ position: 'relative' }}
      data-testid="musd-conversion-heading"
    >
      <Text
        variant={TextVariant.HeadingLg}
        textAlign={TextAlign.Center}
        data-testid="musd-conversion-heading-title"
      >
        {t('musdConvertAndGetBonus', [String(MUSD_CONVERSION_APY)])}
      </Text>

      <Box style={{ position: 'absolute', right: 16 }}>
        <ButtonIcon
          ref={buttonRef}
          ariaLabel={t('info')}
          iconName={IconName.Info}
          size={ButtonIconSize.Md}
          onClick={handleInfoClick}
          data-testid="musd-conversion-heading-info-button"
        />
        <Popover
          isOpen={isTooltipOpen}
          position={PopoverPosition.BottomEnd}
          referenceElement={buttonRef.current}
          hasArrow
          onPressEscKey={handleCloseTooltip}
          onClickOutside={handleCloseTooltip}
          isPortal
          data-testid="musd-conversion-heading-tooltip"
        >
          <Box padding={2} style={{ maxWidth: 280 }}>
            <Text variant={TextVariant.BodySm}>
              {t('musdBonusExplanation', [
                String(MUSD_CONVERSION_APY),
                <TextButton
                  key="terms-link"
                  size={TextButtonSize.BodyMd}
                  asChild
                  color={TextColor.TextDefault}
                >
                  <a
                    href={MUSD_CONVERSION_BONUS_TERMS_OF_USE}
                    style={{ textDecoration: 'underline' }}
                  >
                    {t('musdTermsApply')}
                  </a>
                </TextButton>,
              ])}
            </Text>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};

export default MusdConversionHeading;
