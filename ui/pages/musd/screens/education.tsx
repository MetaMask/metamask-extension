/**
 * MUSD Education Screen
 *
 * Splash screen that introduces the mUSD conversion feature and its bonus.
 * Shown to users who haven't seen the education content before.
 */

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  IconColor,
  TextVariant,
  TextColor,
  TextAlign,
  FontFamily,
  TextTransform,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  BoxBackgroundColor,
  TextButton,
  TextButtonSize,
} from '@metamask/design-system-react';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  MUSD_EVENTS_CONSTANTS,
  type MusdEducationButtonClickedEventProperties,
} from '../../../components/app/musd/musd-events';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTheme } from '../../../hooks/useTheme';
import { setMusdConversionEducationSeen } from '../../../store/actions';
import {
  useMusdConversion,
  useMusdGeoBlocking,
  useMusdConversionTokens,
  useCanBuyMusd,
} from '../../../hooks/musd';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
} from '../../../components/app/musd/constants';
import { MUSD_DEEPLINK_PARAM } from '../../../../shared/lib/deep-links/routes/musd';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

const MUSD_EDUCATION_COIN_IMAGE_DARK = './images/musd-education-coin-dark.png';
const MUSD_EDUCATION_COIN_IMAGE_LIGHT =
  './images/musd-education-coin-light.png';

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
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useContext(MetaMetricsContext);

  const isDeeplink = searchParams.get(MUSD_DEEPLINK_PARAM) === 'true';

  // Track education screen display on mount (fire-once guard)
  const hasTrackedDisplayRef = useRef(false);
  useEffect(() => {
    if (hasTrackedDisplayRef.current) {
      return;
    }
    hasTrackedDisplayRef.current = true;

    trackEvent({
      event: MetaMetricsEventName.MusdFullscreenAnnouncementDisplayed,
      category: MetaMetricsEventCategory.MusdConversion,
      properties: {
        location:
          MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.CONVERSION_EDUCATION_SCREEN,
      },
    });
  }, [trackEvent]);

  const { startConversionFlow } = useMusdConversion();
  const { isBlocked: isGeoBlocked } = useMusdGeoBlocking();
  const { tokens: conversionTokens, defaultPaymentToken } =
    useMusdConversionTokens();
  const { canBuyMusdInRegion } = useCanBuyMusd();
  const { openBuyCryptoInPdapp } = useRamps();
  const [isLoading, setIsLoading] = useState(false);

  const hasEligibleConversionTokens = conversionTokens.length > 0;

  /**
   * When deeplink and user has no eligible tokens: if they can buy in region
   * (not geo-blocked AND buyable on at least one enabled chain) then primary
   * CTA goes to buy flow; otherwise "Continue" goes home.
   */
  const isDeeplinkNoTokensContinueHome =
    isDeeplink && !hasEligibleConversionTokens && !canBuyMusdInRegion;
  const isDeeplinkNoTokensGoToBuy =
    isDeeplink && !hasEligibleConversionTokens && canBuyMusdInRegion;

  // Determine button labels - must be before callbacks that use them
  let primaryButtonLabel = t('musdEducationGetStarted') as string;
  if (isDeeplinkNoTokensGoToBuy) {
    primaryButtonLabel = t('musdBuyMusd') as string;
  } else if (isDeeplinkNoTokensContinueHome || isGeoBlocked) {
    primaryButtonLabel = t('continue') as string;
  }
  const secondaryButtonLabel = t('musdEducationNotNow') as string;

  /**
   * Determine redirect destination for analytics
   */
  const getRedirectDestination =
    useCallback((): MusdEducationButtonClickedEventProperties['redirects_to'] => {
      if (isDeeplinkNoTokensGoToBuy) {
        return MUSD_EVENTS_CONSTANTS.REDIRECT_DESTINATIONS
          .BUY_SCREEN as MusdEducationButtonClickedEventProperties['redirects_to'];
      }
      if (isDeeplinkNoTokensContinueHome || isGeoBlocked) {
        return MUSD_EVENTS_CONSTANTS.REDIRECT_DESTINATIONS
          .HOME_SCREEN as MusdEducationButtonClickedEventProperties['redirects_to'];
      }
      return MUSD_EVENTS_CONSTANTS.REDIRECT_DESTINATIONS
        .CUSTOM_AMOUNT_SCREEN as MusdEducationButtonClickedEventProperties['redirects_to'];
    }, [
      isDeeplinkNoTokensGoToBuy,
      isDeeplinkNoTokensContinueHome,
      isGeoBlocked,
    ]);

  /**
   * Handle primary CTA click.
   * - Deeplink + no tokens + can buy: open buy flow then go home ("Buy mUSD").
   * - Deeplink + no tokens + cannot buy: go home ("Continue").
   * - Geo-blocked (non-deeplink): go home ("Continue").
   * - Otherwise (including deeplink + has tokens): start conversion flow ("Get started").
   */
  const handleContinue = useCallback(async () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const eventProperties: MusdEducationButtonClickedEventProperties = {
      location:
        MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.CONVERSION_EDUCATION_SCREEN,
      button_type: MUSD_EVENTS_CONSTANTS.BUTTON_TYPES.PRIMARY,
      button_text: primaryButtonLabel,
      redirects_to: getRedirectDestination(),
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    // Track primary button click
    trackEvent({
      event: MetaMetricsEventName.MusdFullscreenAnnouncementButtonClicked,
      category: MetaMetricsEventCategory.MusdConversion,
      properties: eventProperties,
    });

    dispatch(setMusdConversionEducationSeen(true));

    if (isDeeplinkNoTokensGoToBuy) {
      openBuyCryptoInPdapp(MUSD_CONVERSION_DEFAULT_CHAIN_ID);
      navigate(DEFAULT_ROUTE);
      return;
    }

    if (isDeeplinkNoTokensContinueHome) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    if (isGeoBlocked) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    setIsLoading(true);

    if (!defaultPaymentToken) {
      console.error('[MUSD] No default payment token was found for conversion');
      navigate(DEFAULT_ROUTE);
      return;
    }

    try {
      await startConversionFlow({
        preferredToken: {
          address: defaultPaymentToken.address,
          chainId: defaultPaymentToken.chainId,
        },
        skipEducation: true,
        entryPoint: isDeeplink ? 'deeplink' : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    dispatch,
    navigate,
    isDeeplinkNoTokensGoToBuy,
    isDeeplinkNoTokensContinueHome,
    isDeeplink,
    isGeoBlocked,
    openBuyCryptoInPdapp,
    startConversionFlow,
    defaultPaymentToken,
    trackEvent,
    primaryButtonLabel,
    getRedirectDestination,
  ]);

  /**
   * Handle close / "Not now" button click.
   * Marks education as seen and navigates home.
   */
  const handleSkip = useCallback(() => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const eventProperties: MusdEducationButtonClickedEventProperties = {
      location:
        MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.CONVERSION_EDUCATION_SCREEN,
      button_type: MUSD_EVENTS_CONSTANTS.BUTTON_TYPES.SECONDARY,
      button_text: secondaryButtonLabel,
      redirects_to: MUSD_EVENTS_CONSTANTS.REDIRECT_DESTINATIONS.HOME_SCREEN,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    // Track secondary button click
    trackEvent({
      event: MetaMetricsEventName.MusdFullscreenAnnouncementButtonClicked,
      category: MetaMetricsEventCategory.MusdConversion,
      properties: eventProperties,
    });

    dispatch(setMusdConversionEducationSeen(true));
    navigate(DEFAULT_ROUTE);
  }, [dispatch, navigate, trackEvent, secondaryButtonLabel]);

  return (
    <Box
      className="musd-education-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
      }}
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      {/* Close icon – top-right */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        paddingTop={3}
        paddingRight={4}
        style={{ flexShrink: 0 }}
      >
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close') as string}
          size={ButtonIconSize.Sm}
          color={IconColor.IconDefault}
          onClick={handleSkip}
          data-testid="musd-education-skip-button"
        />
      </Box>

      {/* Main content – scrolls on short viewports; CTAs stay pinned below */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        paddingLeft={4}
        paddingRight={4}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {/* Inner wrapper – safe center: vertically centers when content fits; start-aligns when it would overflow (Chromium). */}
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          style={{
            minHeight: '100%',
            // `safe center` avoids unsafe flex centering that clips the top of the hero when scrolling.
            justifyContent: 'safe center',
          }}
        >
          {/* Hero headline */}
          <Box marginBottom={3}>
            <Text
              variant={TextVariant.DisplayMd}
              fontFamily={FontFamily.Hero}
              textAlign={TextAlign.Center}
              color={TextColor.TextDefault}
              textTransform={TextTransform.Uppercase}
              style={{ whiteSpace: 'pre-line' }}
            >
              {t('musdEducationHeadline', [String(MUSD_CONVERSION_APY)])}
            </Text>
          </Box>

          {/* Body copy */}
          <Box marginBottom={4}>
            <Text
              variant={TextVariant.BodyMd}
              textAlign={TextAlign.Center}
              color={TextColor.TextAlternative}
              style={{ whiteSpace: 'pre-line' }}
            >
              {t('musdBonusExplanation', [
                String(MUSD_CONVERSION_APY),
                <TextButton
                  key="terms-link"
                  size={TextButtonSize.BodyMd}
                  asChild
                >
                  <a
                    href={MUSD_CONVERSION_BONUS_TERMS_OF_USE}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      const properties = {
                        location: 'conversion_education_screen',
                        url: MUSD_CONVERSION_BONUS_TERMS_OF_USE,
                      };

                      trackEvent({
                        event: MetaMetricsEventName.MusdBonusTermsOfUsePressed,
                        category: MetaMetricsEventCategory.MusdConversion,
                        properties,
                      });
                    }}
                  >
                    {t('musdTermsApply')}
                  </a>
                </TextButton>,
              ])}
            </Text>
          </Box>

          {/* Central illustration */}
          <Box
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
          >
            <img
              src={
                theme === ThemeType.dark
                  ? MUSD_EDUCATION_COIN_IMAGE_DARK
                  : MUSD_EDUCATION_COIN_IMAGE_LIGHT
              }
              alt={t('musdGetMusd') as string}
              width={252}
              height={252}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        </Box>
      </Box>

      {/* Footer actions – full-width buttons with padding to match Figma */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        padding={4}
        style={{ flexShrink: 0 }}
      >
        <Box style={{ width: '100%' }}>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleContinue}
            disabled={isLoading}
            style={{ width: '100%' }}
            data-testid="musd-education-continue-button"
          >
            {primaryButtonLabel}
          </Button>
        </Box>

        <Box style={{ width: '100%' }}>
          <Button
            variant={ButtonVariant.Tertiary}
            size={ButtonSize.Lg}
            onClick={handleSkip}
            style={{ width: '100%', color: 'var(--color-text-default)' }}
            data-testid="musd-education-not-now-button"
          >
            {secondaryButtonLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MusdEducationScreen;
