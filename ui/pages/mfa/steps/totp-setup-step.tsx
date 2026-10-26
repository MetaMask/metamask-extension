import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonBase,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTheme } from '../../../hooks/useTheme';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

/**
 * Shows the setup key in groups of four, as authenticator apps print it.
 *
 * @param secret - The base32 secret.
 * @returns The grouped key.
 */
const formatSetupKey = (secret: string) =>
  secret.match(/.{1,4}/gu)?.join(' ') ?? secret;

/**
 * Adds MetaMask to the user's authenticator app: its phone scans the QR code,
 * or the user types the setup key. The secret and QR code are never stored,
 * and a copied key is cleared from the clipboard.
 *
 * @param props - The step's props.
 * @param props.step - The setup step, with the secret and QR code.
 * @param props.state - The flow state.
 * @param props.onAction - Continues to the code.
 */
const TotpSetupStep = ({ step, state, onAction }: StepProps<'totpSetup'>) => {
  const t = useI18nContext();
  const theme = useTheme();
  const [isCopied, copy] = useCopyToClipboard({ sensitive: true });

  return (
    <StepLayout
      title={t('mfaTotpSetupTitle')}
      description={t('mfaTotpSetupDescription')}
      error={state.error}
      footer={
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isLoading={state.busy}
          onClick={() => onAction({ type: 'continue' })}
          data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
        >
          {t('mfaTotpSetupContinue')}
        </Button>
      }
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={4} paddingTop={2}>
        {step.isRestart ? (
          <BannerAlert
            severity={BannerAlertSeverity.Warning}
            description={t('mfaTotpSetupRestarted')}
          />
        ) : null}
        {/* The QR code needs a light background to scan in dark mode. */}
        <Box
          alignItems={BoxAlignItems.Center}
          className={`self-center overflow-hidden rounded-2xl p-4 ${
            theme === ThemeType.light ? 'bg-muted' : 'bg-white'
          }`}
        >
          <img
            src={step.qrCode}
            alt={t('mfaTotpSetupQrAlt')}
            width={184}
            height={184}
            data-testid={MfaFlowTestIds.TOTP_QR_IMAGE}
          />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={4}
          paddingVertical={2}
        >
          <Box className="flex-1 border-t-[1.5px] border-muted" />
          <Text variant={TextVariant.BodyMd} color={TextColor.TextMuted}>
            {t('mfaTotpSetupManual')}
          </Text>
          <Box className="flex-1 border-t-[1.5px] border-muted" />
        </Box>
        <ButtonBase
          className="h-auto w-full justify-start gap-3 rounded-2xl bg-muted p-4 text-left hover:bg-muted-hover active:bg-muted-pressed"
          onClick={() => copy(step.secret)}
          data-testid={MfaFlowTestIds.TOTP_COPY_KEY}
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={1}
            className="flex-1"
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('mfaTotpSetupKey')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              className="break-all"
              data-testid={MfaFlowTestIds.TOTP_SETUP_KEY}
            >
              {formatSetupKey(step.secret)}
            </Text>
          </Box>
          <Icon
            name={isCopied ? IconName.CopySuccess : IconName.Copy}
            color={isCopied ? IconColor.SuccessDefault : undefined}
            aria-hidden
          />
        </ButtonBase>
        <Text asChild variant={TextVariant.BodySm}>
          <span className="sr-only" role="status">
            {isCopied ? t('mfaTotpSetupCopied') : null}
          </span>
        </Text>
      </Box>
    </StepLayout>
  );
};

export default TotpSetupStep;
