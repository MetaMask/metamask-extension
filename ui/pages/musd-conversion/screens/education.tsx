/**
 * MUSD Education Screen
 *
 * Splash screen that introduces the mUSD conversion feature and its bonus.
 * Shown to users who haven't seen the education content before.
 */

///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
  TextAlign,
  TextColor,
  BlockSize,
  FontFamily,
  TextTransform,
  IconColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setEducationSeen } from '../../../ducks/musd';
import { useMusdConversion } from '../../../hooks/musd';
import { MUSD_CONVERSION_APY } from '../../../../shared/constants/musd';

const MUSD_EDUCATION_COIN_IMAGE = './images/musd-education-coin.png';

/**
 * MUSD Education Screen Component
 *
 * Displays a splash screen with:
 * - Close (X) icon button in the top-right corner
 * - Large hero headline using MMPoly font
 * - Body copy explaining the mUSD conversion bonus
 * - Central illustration (coin + MetaMask fox + bonus)
 * - "Get started" primary button and "Not now" link button
 */
const MusdEducationScreen: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { startConversionFlow } = useMusdConversion();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle "Get started" button click.
   * Marks education as seen, then creates the tx and navigates to pay-with.
   */
  const handleContinue = useCallback(async () => {
    dispatch(setEducationSeen(true));

    setIsLoading(true);
    try {
      await startConversionFlow({ skipEducation: true });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, startConversionFlow]);

  /**
   * Handle close / "Not now" button click.
   * Marks education as seen and navigates back.
   */
  const handleSkip = useCallback(() => {
    dispatch(setEducationSeen(true));
    navigate(-1);
  }, [dispatch, navigate]);

  return (
    <Box
      className="musd-education-screen"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      {/* Close icon – top-right */}
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        paddingTop={3}
        paddingRight={4}
      >
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close') as string}
          size={ButtonIconSize.Sm}
          color={IconColor.iconDefault}
          onClick={handleSkip}
          data-testid="musd-education-skip-button"
        />
      </Box>

      {/* Main content – vertically centered */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        paddingLeft={4}
        paddingRight={4}
        style={{ flex: 1 }}
      >
        {/* Hero headline */}
        <Text
          variant={TextVariant.displayMd}
          fontFamily={FontFamily.Hero}
          textAlign={TextAlign.Center}
          color={TextColor.textDefault}
          textTransform={TextTransform.Uppercase}
          marginBottom={3}
        >
          {t('musdEducationHeadline', [String(MUSD_CONVERSION_APY)])}
        </Text>

        {/* Body copy */}
        <Text
          variant={TextVariant.bodyMdMedium}
          textAlign={TextAlign.Center}
          color={TextColor.textAlternative}
          marginBottom={4}
        >
          {t('musdBonusExplanation', [String(MUSD_CONVERSION_APY)])}
        </Text>

        {/* Central illustration */}
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <img
            src={MUSD_EDUCATION_COIN_IMAGE}
            alt={t('musdGetMusd') as string}
            width={252}
            height={252}
          />
        </Box>
      </Box>

      {/* Footer actions */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        padding={4}
      >
        {/* Primary CTA */}
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleContinue}
          disabled={isLoading}
          block
          data-testid="musd-education-continue-button"
        >
          {t('musdEducationGetStarted')}
        </Button>

        {/* Secondary – "Not now" */}
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Lg}
          onClick={handleSkip}
          block
          data-testid="musd-education-not-now-button"
        >
          {t('musdEducationNotNow')}
        </Button>
      </Box>
    </Box>
  );
};

export default MusdEducationScreen;
///: END:ONLY_INCLUDE_IF
