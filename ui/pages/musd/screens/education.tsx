/**
 * MUSD Education Screen
 *
 * Splash screen that introduces the mUSD conversion feature and its bonus.
 * Shown to users who haven't seen the education content before.
 */

import React, { useCallback, useState } from 'react';
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
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
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
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
} from '../../../components/app/musd/constants';
import { MUSD_DEEPLINK_PARAM } from '../../../../shared/lib/deep-links/routes/musd';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

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
  const [searchParams] = useSearchParams();

  const isDeeplink = searchParams.get(MUSD_DEEPLINK_PARAM) === 'true';

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

  /**
   * Handle primary CTA click.
   * - Deeplink + can buy + no tokens: open buy flow then go home ("Buy mUSD").
   * - Deeplink + cannot buy: go home ("Continue").
   * - Geo-blocked: go home ("Continue").
   * - Otherwise: start conversion flow ("Get started").
   */
  const handleContinue = useCallback(async () => {
    dispatch(setMusdConversionEducationSeen(true));

    if (isDeeplinkNoTokensGoToBuy) {
      openBuyCryptoInPdapp(MUSD_CONVERSION_DEFAULT_CHAIN_ID);
      navigate(DEFAULT_ROUTE);
      return;
    }

    if (isDeeplink && !canBuyMusdInRegion) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    if (isGeoBlocked) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    setIsLoading(true);
    try {
      await startConversionFlow({
        preferredToken: defaultPaymentToken
          ? {
              address: defaultPaymentToken.address,
              chainId: defaultPaymentToken.chainId,
            }
          : undefined,
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
    isDeeplink,
    canBuyMusdInRegion,
    isGeoBlocked,
    openBuyCryptoInPdapp,
    startConversionFlow,
    defaultPaymentToken,
  ]);

  /**
   * Handle close / "Not now" button click.
   * Marks education as seen and navigates home.
   */
  const handleSkip = useCallback(() => {
    dispatch(setMusdConversionEducationSeen(true));
    navigate(DEFAULT_ROUTE);
  }, [dispatch, navigate]);

  let primaryButtonLabel = t('musdEducationGetStarted');
  if (isDeeplinkNoTokensGoToBuy) {
    primaryButtonLabel = t('musdBuyMusd');
  } else if (
    isDeeplinkNoTokensContinueHome ||
    isGeoBlocked ||
    (isDeeplink && !canBuyMusdInRegion)
  ) {
    primaryButtonLabel = t('continue');
  }

  return (
    <Box
      className="musd-education-screen"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      {/* Close icon – top-right */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        paddingTop={3}
        paddingRight={4}
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

      {/* Main content – vertically centered */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        paddingLeft={4}
        paddingRight={4}
        style={{ flex: 1 }}
      >
        {/* Hero headline */}
        <Box marginBottom={3}>
          <Text
            variant={TextVariant.DisplayMd}
            fontFamily={FontFamily.Hero}
            textAlign={TextAlign.Center}
            color={TextColor.TextDefault}
            textTransform={TextTransform.Uppercase}
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
          >
            {t('musdBonusExplanation', [String(MUSD_CONVERSION_APY)])}
          </Text>
        </Box>

        {/* Central illustration */}
        <Box
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
        >
          <img
            src={MUSD_EDUCATION_COIN_IMAGE}
            alt={t('musdGetMusd') as string}
            width={252}
            height={252}
          />
        </Box>
      </Box>

      {/* Footer actions – full-width buttons with padding to match Figma */}
      <Box flexDirection={BoxFlexDirection.Column} gap={2} padding={4}>
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
            style={{ width: '100%', color: 'var(--color-overlay-inverse)' }}
            data-testid="musd-education-not-now-button"
          >
            {t('musdEducationNotNow')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MusdEducationScreen;
