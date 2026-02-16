///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Popover,
  PopoverPosition,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { MUSD_CONVERSION_APY } from '../../../../../../shared/constants/musd';

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
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      paddingTop={4}
      paddingBottom={2}
      style={{ position: 'relative' }}
      data-testid="musd-conversion-heading"
    >
      <Text
        variant={TextVariant.headingLg}
        textAlign={TextAlign.Center}
        data-testid="musd-conversion-heading-title"
      >
        {t('musdConvertAndGetBonus')}
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
            <Text variant={TextVariant.bodySm}>
              {t('musdBonusExplanation', [String(MUSD_CONVERSION_APY)])}
            </Text>
          </Box>
        </Popover>
      </Box>
    </Box>
  );
};

export default MusdConversionHeading;
///: END:ONLY_INCLUDE_IF
