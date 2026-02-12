/**
 * MUSD Education Screen
 *
 * Onboarding screen that explains the mUSD conversion feature and its benefits.
 * Shown to users who haven't seen the education content before.
 */

///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
  TextAlign,
  FontWeight,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setEducationSeen,
  selectSelectedPaymentToken,
} from '../../../ducks/musd';
import { useMusdConversion } from '../../../hooks/musd';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../../shared/constants/musd';

/**
 * Education screen content configuration
 */
const EDUCATION_CONTENT = {
  title: 'Get mUSD',
  subtitle: 'The stablecoin that pays you back',
  benefits: [
    {
      icon: 'percentage',
      title: `${MUSD_CONVERSION_APY}% APY Bonus`,
      description: 'Earn rewards just for holding mUSD',
    },
    {
      icon: 'swap-horizontal',
      title: 'Easy conversion',
      description: 'Convert your stablecoins in one tap',
    },
    {
      icon: 'shield-check',
      title: 'Secure and stable',
      description: 'Backed 1:1 with USD',
    },
  ],
};

/**
 * MUSD Education Screen Component
 */
const MusdEducationScreen: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedPaymentToken = useSelector(selectSelectedPaymentToken);
  const { startConversionFlow } = useMusdConversion();
  const [isLoading, setIsLoading] = useState(false);

  const getButtonLabel = (): string => {
    if (isLoading) {
      return 'Loading...';
    }
    if (selectedPaymentToken) {
      return `Convert ${selectedPaymentToken.symbol} to mUSD`;
    }
    return 'Get mUSD';
  };

  /**
   * Handle continue button click.
   * Marks education as seen, then creates the tx and navigates to pay-with.
   */
  const handleContinue = useCallback(async () => {
    // Mark education as seen
    dispatch(setEducationSeen(true));

    // Create tx and navigate to pay-with confirmation
    setIsLoading(true);
    try {
      await startConversionFlow({ skipEducation: true });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, startConversionFlow]);

  /**
   * Handle skip/close button click
   */
  const handleSkip = useCallback(() => {
    // Mark education as seen
    dispatch(setEducationSeen(true));

    // Go back to previous screen
    navigate(-1);
  }, [dispatch, navigate]);

  /**
   * Handle terms link click
   */
  const handleTermsClick = useCallback(() => {
    window.open(MUSD_CONVERSION_BONUS_TERMS_OF_USE, '_blank', 'noopener');
  }, []);

  return (
    <Box
      className="musd-education-screen"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
      padding={4}
    >
      {/* Header */}
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        marginBottom={4}
      >
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Sm}
          onClick={handleSkip}
          data-testid="musd-education-skip-button"
        >
          {t('close') || 'Close'}
        </Button>
      </Box>

      {/* Main content */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        className="musd-education-screen__content"
        style={{ flex: 1 }}
      >
        {/* Icon/illustration */}
        <Box marginBottom={4}>
          <Box
            className="musd-education-screen__icon"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              variant={TextVariant.headingLg}
              color="var(--color-primary-inverse)"
              fontWeight={FontWeight.Bold}
            >
              m$
            </Text>
          </Box>
        </Box>

        {/* Title */}
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
          marginBottom={2}
        >
          {EDUCATION_CONTENT.title}
        </Text>

        {/* Subtitle */}
        <Text
          variant={TextVariant.bodyMd}
          color="var(--color-text-alternative)"
          textAlign={TextAlign.Center}
          marginBottom={6}
        >
          {EDUCATION_CONTENT.subtitle}
        </Text>

        {/* Benefits list */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          width={BlockSize.Full}
          marginBottom={6}
        >
          {EDUCATION_CONTENT.benefits.map((benefit, index) => (
            <Box
              key={index}
              display={Display.Flex}
              alignItems={AlignItems.flexStart}
              gap={3}
            >
              <Box
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-background-alternative)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text
                  variant={TextVariant.bodyLg}
                  color="var(--color-primary-default)"
                >
                  {index === 0 ? '%' : index === 1 ? '↔' : '✓'}
                </Text>
              </Box>
              <Box>
                <Text variant={TextVariant.bodyMdBold} marginBottom={1}>
                  {benefit.title}
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color="var(--color-text-alternative)"
                >
                  {benefit.description}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={3}>
        {/* Terms notice */}
        <Text
          variant={TextVariant.bodyXs}
          color="var(--color-text-alternative)"
          textAlign={TextAlign.Center}
        >
          By continuing, you agree to the{' '}
          <Button
            variant={ButtonVariant.Link}
            size={ButtonSize.Inherit}
            onClick={handleTermsClick}
            style={{ fontSize: 'inherit', textDecoration: 'underline' }}
          >
            bonus terms of use
          </Button>
        </Text>

        {/* CTA button */}
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleContinue}
          disabled={isLoading}
          block
          data-testid="musd-education-continue-button"
        >
          {getButtonLabel()}
        </Button>
      </Box>
    </Box>
  );
};

export default MusdEducationScreen;
///: END:ONLY_INCLUDE_IF
