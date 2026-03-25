import React, { useState, useCallback, useRef } from 'react';
import classnames from 'clsx';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconName,
  IconColor,
  IconSize,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
} from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import { ACCOUNT_LIST_PAGE_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';

const slide1Image = './images/2fa-slide1-wallet.png';
const slide2Image = './images/2fa-slide2-lock.png';
const slide3Image = './images/2fa-slide3-keychain.png';
const foxBgImage = './images/2fa-fox-bg.png';
const successPhoneImage = './images/2fa-success-phone.png';

// ─── Types & Data ────────────────────────────────────────────────────

type FactorId = 'email' | 'sms' | 'social' | 'authenticator' | 'passkeys' | 'mobile';

type SecurityLevel = 'most' | 'more' | 'less';

type FactorOption = {
  id: FactorId;
  nameKey: string;
  descKey: string;
  icon: IconName;
  security: SecurityLevel;
};

type ConfiguredFactor = {
  id: FactorId;
  detail?: string;
};

const ALL_FACTORS: FactorOption[] = [
  { id: 'mobile', nameKey: 'twoFAFactorMobileDevice', descKey: 'twoFAFactorMobileDeviceDesc', icon: IconName.Mobile, security: 'more' },
  { id: 'authenticator', nameKey: 'twoFAFactorAuthenticator', descKey: 'twoFAFactorAuthenticatorDesc', icon: IconName.SecurityKey, security: 'more' },
  { id: 'passkeys', nameKey: 'twoFAFactorPasskeys', descKey: 'twoFAFactorPasskeysDesc', icon: IconName.Fingerprint, security: 'most' },
  { id: 'email', nameKey: 'twoFAFactorEmailOtp', descKey: 'twoFAFactorEmailOtpDesc', icon: IconName.Mail, security: 'more' },
  { id: 'sms', nameKey: 'twoFAFactorSmsOtp', descKey: 'twoFAFactorSmsOtpDesc', icon: IconName.Sms, security: 'less' },
  { id: 'social', nameKey: 'twoFAFactorSocialLogin', descKey: 'twoFAFactorSocialLoginDesc', icon: IconName.Global, security: 'more' },
];

const DEFAULT_FACTORS: FactorId[] = ['email', 'authenticator'];
const BACKUP_ALLOWED_IDS: FactorId[] = ['mobile', 'email', 'passkeys', 'sms', 'social'];

type Step = 'carousel-0' | 'carousel-1' | 'carousel-2' | 'signing' | 'recovery' | 'success';

function getProgressStage(step: Step): number {
  if (step === 'signing') return 1;
  if (step === 'recovery') return 2;
  if (step === 'success') return 3;
  return 0;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user[0]}***@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-2)}`;
}

// ─── Shared UI ───────────────────────────────────────────────────────

function SetupHeader({ onBack, onClose, t }: { onBack: () => void; onClose: () => void; t: (key: string) => string }) {
  return (
    <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between} padding={4} className="shrink-0">
      <ButtonIcon iconName={IconName.ArrowLeft} ariaLabel="Back" size={ButtonIconSize.Sm} onClick={onBack} />
      <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>{t('twoFAWalletSetup')}</Text>
      <ButtonIcon iconName={IconName.Close} ariaLabel="Close" size={ButtonIconSize.Sm} onClick={onClose} />
    </Box>
  );
}

function StepProgress({ stage, t }: { stage: number; t: (key: string) => string }) {
  const steps = [
    { key: 'twoFAStepSigning', stageNum: 1 },
    { key: 'twoFAStepRecovery', stageNum: 2 },
  ];
  return (
    <Box flexDirection={BoxFlexDirection.Row} paddingHorizontal={4} paddingBottom={3} gap={2} className="shrink-0">
      {steps.map((step, i) => {
        const isActive = stage === step.stageNum;
        const isCompleted = stage > step.stageNum;

        return (
          <Box key={i} className="flex-1" flexDirection={BoxFlexDirection.Column} alignItems={BoxAlignItems.Start}>
            <Box
              className="w-full rounded-full"
              style={{
                height: 3,
                backgroundColor: isActive ? 'var(--color-primary-default)' : isCompleted ? 'var(--color-primary-default)' : 'var(--color-border-muted)',
                opacity: isCompleted ? 0.4 : 1,
              }}
            />
            <Text
              variant={TextVariant.BodyXs}
              fontWeight={isActive ? FontWeight.Bold : FontWeight.Medium}
              color={isActive ? TextColor.TextDefault : TextColor.TextMuted}
              className="pt-1.5"
            >
              {t(step.key)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

function CarouselDots({ current, total }: { current: number; total: number }) {
  return (
    <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={1}>
      {Array.from({ length: total }).map((_, i) => (
        <Box key={i} className="rounded-full transition-all duration-300" style={{
          width: i === current ? 24 : 8, height: 8,
          backgroundColor: i === current ? 'var(--color-text-default)' : 'var(--color-text-muted)',
        }} />
      ))}
    </Box>
  );
}

// ─── Factor Row (compact, matches JasonBorg/Google style) ────────────

function FactorRow({ factor, configured, onSetUp, disabledReason, t }: {
  factor: FactorOption;
  configured?: ConfiguredFactor;
  onSetUp: () => void;
  disabledReason?: string;
  t: (key: string) => string;
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const isConfigured = Boolean(configured);
  const isDisabled = !isConfigured && Boolean(disabledReason);
  const showLessSecure = !isConfigured && !isDisabled && factor.security === 'less';

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      paddingVertical={3}
      paddingHorizontal={3}
      gap={3}
      borderColor={BoxBorderColor.BorderMuted}
      className="border-b last:border-b-0"
      style={isDisabled ? { opacity: 0.55 } : undefined}
    >
      <Box
        backgroundColor={isConfigured ? BoxBackgroundColor.SuccessMuted : BoxBackgroundColor.BackgroundMuted}
        className="rounded-full p-1.5 shrink-0"
      >
        <Icon name={factor.icon} size={IconSize.Sm} color={isConfigured ? IconColor.SuccessDefault : IconColor.IconAlternative} />
      </Box>
      <Box className="flex-1 min-w-0">
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} color={TextColor.TextDefault}>
          {t(factor.nameKey)}
        </Text>
        {isConfigured && configured?.detail ? (
          <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{configured.detail}</Text>
        ) : showLessSecure ? (
          <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.ErrorDefault}
            className="text-[10px] uppercase tracking-wider"
          >
            {t('twoFALessSecure')}
          </Text>
        ) : null}
      </Box>
      {isConfigured ? (
        <Box backgroundColor={BoxBackgroundColor.SuccessMuted} className="rounded-full px-2.5 py-1">
          <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.SuccessDefault}
            className="text-[10px]"
          >
            {t('twoFAActive')}
          </Text>
        </Box>
      ) : isDisabled ? (
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} isDisabled onClick={() => undefined}>
            {t('twoFASetUp')}
          </Button>
          {tooltipVisible && (
            <div style={{
              position: 'absolute',
              right: 0,
              bottom: 'calc(100% + 6px)',
              width: 220,
              background: 'var(--color-background-alternative)',
              border: '1px solid var(--color-border-muted)',
              borderRadius: 8,
              padding: '8px 10px',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-alternative)', lineHeight: 1.5 }}>
                {disabledReason}
              </span>
            </div>
          )}
        </div>
      ) : (
        <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={onSetUp}>
          {t('twoFASetUp')}
        </Button>
      )}
    </Box>
  );
}

// ─── OTP Input ───────────────────────────────────────────────────────

function OtpInput({ onCodeChange }: { onCodeChange: (code: string, isFull: boolean) => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const char = value.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
    onCodeChange(newDigits.join(''), newDigits.every((d) => d !== ''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  return (
    <Box flexDirection={BoxFlexDirection.Row} gap={2} justifyContent={BoxJustifyContent.Center}>
      {digits.map((digit, i) => (
        <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
          value={digit} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} autoFocus={i === 0}
          style={{
            width: 48, height: 56, borderRadius: 8,
            border: digit ? '2px solid var(--color-primary-default)' : '2px solid var(--color-border-default)',
            background: 'var(--color-background-default)', color: 'var(--color-text-default)',
            fontSize: 24, fontWeight: 700, textAlign: 'center', outline: 'none',
          }}
        />
      ))}
    </Box>
  );
}

// ─── Setup Modal (full-screen overlay) ───────────────────────────────

function SetupModal({ factorId, phase, onComplete, onClose, t }: {
  factorId: FactorId;
  phase: 'signing' | 'recovery';
  onComplete: (detail?: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [subStep, setSubStep] = useState<'input' | 'verify'>('input');
  const [inputValue, setInputValue] = useState('');
  const [otpFilled, setOtpFilled] = useState(false);

  const factor = ALL_FACTORS.find((f) => f.id === factorId)!;

  const header = (
    <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between} padding={4} className="shrink-0">
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel="Back"
        size={ButtonIconSize.Sm}
        onClick={() => { if (subStep === 'verify') setSubStep('input'); else onClose(); }}
      />
      <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>{t(factor.nameKey)}</Text>
      <ButtonIcon iconName={IconName.Close} ariaLabel="Close" size={ButtonIconSize.Sm} onClick={onClose} />
    </Box>
  );

  if (factorId === 'email') {
    if (subStep === 'input') {
      return (
        <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
          {header}
          <Box className="flex-1" paddingHorizontal={4}>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAEnterYourEmail')}</Text>
            <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFAEnterEmailSubtitle')}</Text>
            <FormTextField label={t('twoFAEmailLabel')} placeholder={t('twoFAEmailPlaceholder')} size={FormTextFieldSize.Lg}
              value={inputValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)} autoFocus />
          </Box>
          <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
            <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!inputValue.includes('@')} onClick={() => setSubStep('verify')}>
              {t('twoFASendVerificationEmail')}
            </Button>
          </Box>
        </Box>
      );
    }
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAVerifyYourEmail')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFAVerifyEmailSubtitle')}</Text>
          <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} className="mt-4">
            <TextButton size={TextButtonSize.BodySm} onClick={() => { /* resend logic */ }}>{t('twoFAResendCode')}</TextButton>
          </Box>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!otpFilled} onClick={() => onComplete(maskEmail(inputValue))}>
            {t('twoFAVerify')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (factorId === 'sms') {
    if (subStep === 'input') {
      return (
        <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
          {header}
          <Box className="flex-1" paddingHorizontal={4}>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAEnterYourPhone')}</Text>
            <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFAEnterPhoneSubtitle')}</Text>
            <FormTextField label={t('twoFAPhoneLabel')} placeholder={t('twoFAPhonePlaceholder')} size={FormTextFieldSize.Lg}
              value={inputValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)} autoFocus />
          </Box>
          <Box padding={4} className="shrink-0">
            <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={inputValue.length < 6} onClick={() => setSubStep('verify')}>
              {t('twoFASendVerificationSms')}
            </Button>
          </Box>
        </Box>
      );
    }
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAVerifyYourPhone')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFAVerifyPhoneSubtitle')}</Text>
          <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} className="mt-4">
            <TextButton size={TextButtonSize.BodySm} onClick={() => { /* resend logic */ }}>{t('twoFAResendCode')}</TextButton>
          </Box>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!otpFilled} onClick={() => onComplete(maskPhone(inputValue))}>
            {t('twoFAVerify')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (factorId === 'authenticator') {
    const setupKey = 'XQJF-KGHT-MNPW-2R4S';
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col overflow-hidden">
        {header}
        <Box className="flex-1 overflow-y-auto overflow-x-hidden" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAAuthenticatorSetup')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFAAuthenticatorSubtitle')}</Text>

          {/* Step 1 */}
          <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Start} gap={3} className="mb-4">
            <Box backgroundColor={BoxBackgroundColor.PrimaryMuted} className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">
              <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.PrimaryDefault}>1</Text>
            </Box>
            <Box className="min-w-0">
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>{t('twoFAAuthenticatorStep1')}</Text>
              <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{t('twoFAAuthenticatorStep1Desc')}</Text>
            </Box>
          </Box>

          {/* Step 2 */}
          <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Start} gap={3} className="mb-4">
            <Box backgroundColor={BoxBackgroundColor.PrimaryMuted} className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">
              <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.PrimaryDefault}>2</Text>
            </Box>
            <Box className="flex-1 min-w-0">
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>{t('twoFAAuthenticatorStep2')}</Text>
              <Box
                flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} alignItems={BoxAlignItems.Center}
                backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-xl mt-3 mb-2" style={{ height: 160 }}
              >
                <Icon name={IconName.QrCode} color={IconColor.IconMuted} size={IconSize.Xl} />
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between}
                backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-xl px-3 py-2 mb-1"
              >
                <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Medium} className="font-mono break-all">{setupKey}</Text>
                <ButtonIcon iconName={IconName.Copy} ariaLabel="Copy" size={ButtonIconSize.Sm} onClick={() => navigator.clipboard?.writeText(setupKey.replace(/-/g, ''))} />
              </Box>
            </Box>
          </Box>

          {/* Step 3 */}
          <Box flexDirection={BoxFlexDirection.Column} className="mb-4">
            <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Start} gap={3} className="mb-3">
              <Box backgroundColor={BoxBackgroundColor.PrimaryMuted} className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.PrimaryDefault}>3</Text>
              </Box>
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>{t('twoFAAuthenticatorStep3')}</Text>
            </Box>
            <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
          </Box>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!otpFilled} onClick={() => onComplete(t('twoFAAuthenticatorLinked'))}>
            {t('twoFAAuthenticatorVerify')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (factorId === 'social') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAFactorSocialLogin')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFASocialPickProvider')}</Text>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Box
              flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3} padding={4}
              borderColor={BoxBorderColor.BorderMuted} className="rounded-xl border cursor-pointer hover:bg-background-default-hover"
              onClick={() => onComplete(t('twoFAGoogleLinked'))}
            >
              <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-1.5 shrink-0">
                <Icon name={IconName.Global} color={IconColor.IconDefault} size={IconSize.Sm} />
              </Box>
              <Box className="flex-1">
                <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>{t('twoFAFactorGoogle')}</Text>
                <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{t('twoFAFactorGoogleDesc')}</Text>
              </Box>
              <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconMuted} />
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3} padding={4}
              borderColor={BoxBorderColor.BorderMuted} className="rounded-xl border cursor-pointer hover:bg-background-default-hover"
              onClick={() => onComplete(t('twoFAAppleLinked'))}
            >
              <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-1.5 shrink-0">
                <Icon name={IconName.Mobile} color={IconColor.IconDefault} size={IconSize.Sm} />
              </Box>
              <Box className="flex-1">
                <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>{t('twoFAFactorApple')}</Text>
                <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{t('twoFAFactorAppleDesc')}</Text>
              </Box>
              <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconMuted} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (factorId === 'mobile') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAMobileDeviceSetup')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFAMobileDeviceSubtitle')}</Text>
          <Box flexDirection={BoxFlexDirection.Column} gap={3} className="mb-4">
            {[
              { num: '1', textKey: 'twoFAMobileDeviceStep1' },
              { num: '2', textKey: 'twoFAMobileDeviceStep2' },
              { num: '3', textKey: 'twoFAMobileDeviceStep3' },
            ].map((s) => (
              <Box key={s.num} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3}>
                <Box backgroundColor={BoxBackgroundColor.PrimaryMuted} className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.PrimaryDefault}>{s.num}</Text>
                </Box>
                <Text variant={TextVariant.BodySm}>{t(s.textKey)}</Text>
              </Box>
            ))}
          </Box>
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} alignItems={BoxAlignItems.Center}
            backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-xl" style={{ height: 180 }}>
            <Icon name={IconName.QrCode} color={IconColor.IconMuted} size={IconSize.Xl} />
          </Box>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onClick={() => onComplete(t('twoFAMobileLinked'))}>
            {t('twoFAMobileDeviceLink')}
          </Button>
        </Box>
      </Box>
    );
  }

  if (factorId === 'passkeys') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1 flex flex-col items-center justify-center" paddingHorizontal={4}>
          <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-3 mb-4">
            <Icon name={IconName.Fingerprint} color={IconColor.IconDefault} size={IconSize.Xl} />
          </Box>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="text-center">{t('twoFAPasskeysSetup')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 text-center">{t('twoFAPasskeysSubtitle')}</Text>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth startIconName={IconName.Fingerprint}
            onClick={() => onComplete(t('twoFAPasskeyLinked'))}>
            {t('twoFAPasskeysCreate')}
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
}

// ─── Factor List Screen ──────────────────────────────────────────────

function FactorListScreen({ phase, title, subtitle, factors, excludeIds, configured, onFactorConfigured, onContinue, onBack, onClose, step, minTopCount = 2, t }: {
  phase: 'signing' | 'recovery';
  title: string;
  subtitle: string;
  factors: FactorOption[];
  excludeIds: FactorId[];
  configured: ConfiguredFactor[];
  onFactorConfigured: (factor: ConfiguredFactor) => void;
  onContinue: () => void;
  onBack: () => void;
  onClose: () => void;
  step: Step;
  minTopCount?: number;
  t: (key: string) => string;
}) {
  const [setupModalFactor, setSetupModalFactor] = useState<FactorId | null>(null);
  const [availableExpanded, setAvailableExpanded] = useState(false);
  const [smsWarningVisible, setSmsWarningVisible] = useState(false);
  const [learnMoreVisible, setLearnMoreVisible] = useState(false);

  const available = factors.filter((f) => !excludeIds.includes(f.id));
  const canContinue = configured.length > 0;

  const handleSetupComplete = (detail?: string) => {
    if (setupModalFactor) {
      onFactorConfigured({ id: setupModalFactor, detail });
      setSetupModalFactor(null);
    }
  };

  const handleFactorSetUp = (factorId: FactorId) => {
    if (factorId === 'sms') {
      setSmsWarningVisible(true);
    } else {
      setSetupModalFactor(factorId);
    }
  };

  return (
    <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full relative">
      <SetupHeader onBack={onBack} onClose={onClose} t={t} />
      <StepProgress stage={getProgressStage(step)} t={t} />

      <Box className="flex-1 overflow-y-auto" paddingHorizontal={4}>
        {/* Title */}
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{title}</Text>
        <Box className="mt-1 mb-6">
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="inline">
            {subtitle}{' '}
          </Text>
          <TextButton size={TextButtonSize.BodySm} className="inline" onClick={() => setLearnMoreVisible(true)}>{t('twoFALearnMore')}</TextButton>
        </Box>

        {(() => {
          const configuredIds = configured.map((c) => c.id);
          const hasAnyConfigured = configuredIds.length > 0;
          const configuredFactors = available.filter((f) => configuredIds.includes(f.id));
          const unconfiguredAll = available.filter((f) => !configuredIds.includes(f.id));

          let topFactors: FactorOption[];
          let collapsedFactors: FactorOption[];

          if (hasAnyConfigured) {
            topFactors = configuredFactors;
            collapsedFactors = unconfiguredAll;
          } else {
            const defaults = available.filter((f) => DEFAULT_FACTORS.includes(f.id));
            const rest = available.filter((f) => !DEFAULT_FACTORS.includes(f.id));
            const needed = Math.max(0, minTopCount - defaults.length);
            topFactors = [...defaults, ...rest.slice(0, needed)];
            collapsedFactors = rest.slice(needed);
          }

          return (
            <>
              {/* Top section: configured factors, or defaults when none configured */}
              <Box flexDirection={BoxFlexDirection.Column} gap={2}>
                {topFactors.map((factor) => (
                  <FactorRow
                    key={factor.id}
                    factor={factor}
                    configured={configured.find((c) => c.id === factor.id)}
                    onSetUp={() => handleFactorSetUp(factor.id)}
                    t={t}
                  />
                ))}
              </Box>

              {/* Available methods (collapsible) */}
              {collapsedFactors.length > 0 && (
                <Box className="mt-4">
                  <Box
                    flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between}
                    borderColor={BoxBorderColor.BorderMuted} className="border-t pt-4 cursor-pointer"
                    onClick={() => setAvailableExpanded(!availableExpanded)}
                  >
                    <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextDefault}>
                      {t('twoFAAvailableMethods')}
                    </Text>
                    <Icon name={availableExpanded ? IconName.ArrowUp : IconName.ArrowDown} size={IconSize.Sm} color={IconColor.IconMuted} />
                  </Box>
                  {availableExpanded && (
                    <Box flexDirection={BoxFlexDirection.Column} gap={2} className="mt-3">
                      {collapsedFactors.map((factor) => (
                        <FactorRow
                          key={factor.id}
                          factor={factor}
                          configured={undefined}
                          onSetUp={() => handleFactorSetUp(factor.id)}
                          t={t}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </>
          );
        })()}
      </Box>

      {/* Footer */}
      <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative} className="text-center mb-2">
          {!canContinue
            ? (phase === 'signing' ? t('twoFAAtLeastOneSigning') : t('twoFAAtLeastOneRecovery'))
            : t('twoFACanAddMoreLater')
          }
        </Text>
        <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!canContinue} onClick={onContinue}>
          {phase === 'signing' ? t('twoFAContinue') : t('twoFACreate2FAWallet')}
        </Button>
      </Box>

      {/* SMS Warning Modal */}
      {/* Learn More Bottom Sheet */}
      {learnMoreVisible && (
        <Box className="absolute inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: 'var(--color-overlay-default)' }} onClick={() => setLearnMoreVisible(false)}>
          <Box
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
            className="rounded-t-2xl"
            padding={4}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} className="mb-3">
              <Box className="w-9 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border-default)' }} />
            </Box>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="mb-3">
              {phase === 'signing' ? t('twoFALearnMoreSigningTitle') : t('twoFALearnMoreRecoveryTitle')}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={3} className="mb-4">
              {(phase === 'signing' ? [
                { icon: IconName.SecurityKey, textKey: 'twoFALearnMoreSigningPoint1' },
                { icon: IconName.Lock, textKey: 'twoFALearnMoreSigningPoint2' },
                { icon: IconName.Info, textKey: 'twoFALearnMoreSigningPoint3' },
              ] : [
                { icon: IconName.Refresh, textKey: 'twoFALearnMoreRecoveryPoint1' },
                { icon: IconName.ShieldLock, textKey: 'twoFALearnMoreRecoveryPoint2' },
                { icon: IconName.Add, textKey: 'twoFALearnMoreRecoveryPoint3' },
              ]).map((item, i) => (
                <Box key={i} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Start} gap={3}>
                  <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-1.5 shrink-0 mt-0.5">
                    <Icon name={item.icon} color={IconColor.PrimaryDefault} size={IconSize.Sm} />
                  </Box>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>{t(item.textKey)}</Text>
                </Box>
              ))}
            </Box>
            <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onClick={() => setLearnMoreVisible(false)}>
              {t('twoFAGotIt')}
            </Button>
          </Box>
        </Box>
      )}

      {smsWarningVisible && (
        <Box className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'var(--color-overlay-default)' }}>
          <Box
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
            className="rounded-2xl mx-6 max-w-sm w-full"
            padding={4}
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
          >
            <Box
              backgroundColor={BoxBackgroundColor.WarningMuted}
              className="rounded-full p-3 mb-4"
            >
              <Icon name={IconName.Danger} color={IconColor.WarningDefault} size={IconSize.Xl} />
            </Box>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="text-center mb-2">
              {t('twoFASmsWarningTitle')}
            </Text>
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative} className="text-center mb-6">
              {t('twoFASmsWarningBody')}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={2} className="w-full">
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                isFullWidth
                isDanger
                onClick={() => { setSmsWarningVisible(false); setSetupModalFactor('sms'); }}
              >
                {t('twoFASmsWarningConfirm')}
              </Button>
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={() => setSmsWarningVisible(false)}
              >
                {t('twoFASmsWarningCancel')}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Setup modal overlay */}
      {setupModalFactor && (
        <SetupModal
          factorId={setupModalFactor}
          phase={phase}
          onComplete={handleSetupComplete}
          onClose={() => setSetupModalFactor(null)}
          t={t}
        />
      )}
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export const Setup2FAPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('carousel-0');
  const [configuredSigning, setConfiguredSigning] = useState<ConfiguredFactor[]>([]);
  const [configuredRecovery, setConfiguredRecovery] = useState<ConfiguredFactor[]>([]);

  const handleClose = useCallback(() => navigate(ACCOUNT_LIST_PAGE_ROUTE, { replace: true }), [navigate]);
  const handleGoToWallet = useCallback(() => {
    localStorage.setItem('mm-2fa-wallet-created', 'true');
    localStorage.setItem('mm-2fa-configured-signing', JSON.stringify(configuredSigning.map((f) => f.id)));
    localStorage.setItem('mm-2fa-configured-recovery', JSON.stringify(configuredRecovery.map((f) => f.id)));
    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navigate, configuredSigning, configuredRecovery]);

  const getFactorName = (id: FactorId) => {
    const f = ALL_FACTORS.find((x) => x.id === id);
    return f ? t(f.nameKey) : '';
  };

  const handleBack = useCallback(() => {
    const backMap: Partial<Record<Step, Step>> = {
      'carousel-1': 'carousel-0', 'carousel-2': 'carousel-1',
      'signing': 'carousel-2', 'recovery': 'signing',
    };
    const prev = backMap[step];
    if (prev) setStep(prev);
    else navigate(ACCOUNT_LIST_PAGE_ROUTE, { replace: true });
  }, [step, navigate]);

  const signingFactorIds = configuredSigning.map((c) => c.id);

  // ─── Carousel ──────────────────────────────────────────────────────

  if (step.startsWith('carousel-')) {
    const slideIndex = parseInt(step.split('-')[1], 10);
    const slides = [
      {
        image: slide1Image,
        title: t('twoFASlide1Title'),
        content: (
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm}>{t('twoFASlide1Body')}</Text>
        ),
        buttonText: t('twoFANext'),
        onButton: () => setStep('carousel-1'),
      },
      {
        image: slide2Image,
        title: t('twoFASlide2Title'),
        content: (
          <Box flexDirection={BoxFlexDirection.Column} gap={3}>
            <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Start} gap={3} paddingBottom={3} borderColor={BoxBorderColor.BorderMuted} className="border-b">
              <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-2 shrink-0 mt-0.5">
                <Icon name={IconName.ShieldLock} color={IconColor.PrimaryDefault} size={IconSize.Md} />
              </Box>
              <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm}>{t('twoFASlide2Point1')}</Text>
            </Box>
            <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Start} gap={3}>
              <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-2 shrink-0 mt-0.5">
                <Icon name={IconName.Refresh} color={IconColor.SuccessDefault} size={IconSize.Md} />
              </Box>
              <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm}>{t('twoFASlide2Point2')}</Text>
            </Box>
          </Box>
        ),
        buttonText: t('twoFANext'),
        onButton: () => setStep('carousel-2'),
      },
      {
        image: slide3Image,
        title: t('twoFASlide3Title'),
        content: (
          <Box flexDirection={BoxFlexDirection.Column} gap={3}>
            <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm}>{t('twoFASlide3Intro')}</Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3}>
                <Box backgroundColor={BoxBackgroundColor.InfoMuted} className="rounded-full p-2 shrink-0">
                  <Icon name={IconName.Monitor} color={IconColor.InfoDefault} size={IconSize.Md} />
                </Box>
                <Box className="min-w-0">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>{t('twoFASlide3Share1Title')}</Text>
                  <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{t('twoFASlide3Share1Desc')}</Text>
                </Box>
              </Box>
              <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3}>
                <Box backgroundColor={BoxBackgroundColor.PrimaryMuted} className="rounded-full p-2 shrink-0">
                  <Icon name={IconName.Key} color={IconColor.PrimaryDefault} size={IconSize.Md} />
                </Box>
                <Box className="min-w-0">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>{t('twoFASlide3Share2Title')}</Text>
                  <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{t('twoFASlide3Share2Desc')}</Text>
                </Box>
              </Box>
              <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3}>
                <Box backgroundColor={BoxBackgroundColor.SuccessMuted} className="rounded-full p-2 shrink-0">
                  <Icon name={IconName.Refresh} color={IconColor.SuccessDefault} size={IconSize.Md} />
                </Box>
                <Box className="min-w-0">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>{t('twoFASlide3Share3Title')}</Text>
                  <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{t('twoFASlide3Share3Desc')}</Text>
                </Box>
              </Box>
            </Box>
            <Text color={TextColor.TextMuted} variant={TextVariant.BodyXs}>{t('twoFASlide3Footer')}</Text>
          </Box>
        ),
        buttonText: t('twoFACreateNewWallet'),
        onButton: () => setStep('signing'),
      },
    ];
    const slide = slides[slideIndex];
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full">
        <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between} padding={4} className="shrink-0">
          <ButtonIcon iconName={IconName.ArrowLeft} ariaLabel="Back" size={ButtonIconSize.Sm} onClick={handleBack} />
          <CarouselDots current={slideIndex} total={3} />
          <ButtonIcon iconName={IconName.Close} ariaLabel="Close" size={ButtonIconSize.Sm} onClick={handleClose} />
        </Box>
        <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} alignItems={BoxAlignItems.Center} className="shrink-0 relative overflow-hidden" style={{ height: slideIndex === 2 ? '28%' : '35%' }}>
          <img src={foxBgImage} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />
          <img src={slide.image} alt="" style={{ maxWidth: slideIndex === 2 ? 180 : 240, maxHeight: slideIndex === 2 ? 180 : 240, objectFit: 'contain', position: 'relative', zIndex: 1 }} />
        </Box>
        <Box padding={4} paddingBottom={2} flexDirection={BoxFlexDirection.Column} gap={3} className="flex-1 min-h-0">
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>{slide.title}</Text>
          {slide.content}
        </Box>
        <Box padding={4} paddingTop={2} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onClick={slide.onButton}>{slide.buttonText}</Button>
        </Box>
      </Box>
    );
  }

  // ─── Phase 1: Signing factors ──────────────────────────────────────

  if (step === 'signing') {
    return (
      <FactorListScreen
        phase="signing"
        title={t('twoFAAdd2FAVerification')}
        subtitle={t('twoFAChooseSigningMethod')}
        factors={ALL_FACTORS}
        excludeIds={['social', 'mobile']}
        configured={configuredSigning}
        onFactorConfigured={(f) => setConfiguredSigning((prev) => [...prev.filter((x) => x.id !== f.id), f])}
        onContinue={() => setStep('recovery')}
        onBack={handleBack}
        onClose={handleClose}
        step={step}
        t={t}
      />
    );
  }

  // ─── Phase 2: Recovery factors ─────────────────────────────────────

  if (step === 'recovery') {
    return (
      <FactorListScreen
        phase="recovery"
        title={t('twoFASetupRecoveryFactor')}
        subtitle={t('twoFARecoveryPickerSubtitleNew')}
        factors={ALL_FACTORS.filter((f) => BACKUP_ALLOWED_IDS.includes(f.id))}
        excludeIds={signingFactorIds}
        configured={configuredRecovery}
        onFactorConfigured={(f) => setConfiguredRecovery((prev) => [...prev.filter((x) => x.id !== f.id), f])}
        onContinue={() => setStep('success')}
        onBack={handleBack}
        onClose={handleClose}
        step={step}
        t={t}
      />
    );
  }

  // ─── Success ───────────────────────────────────────────────────────

  if (step === 'success') {
    const allConfigured: { id: FactorId; detail?: string; role: string }[] = [
      ...configuredSigning.map((cf) => ({ ...cf, role: t('twoFASigningFactor') })),
      ...configuredRecovery.map((cf) => ({ ...cf, role: t('twoFARecoveryFactor') })),
    ];

    const confettiColors = ['var(--color-primary-default)', 'var(--color-success-default)', 'var(--color-error-default)', 'var(--color-warning-default)', 'var(--color-primary-alternative)', 'var(--color-info-default)', 'var(--color-accent01-normal)'];
    const confettiPieces = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: confettiColors[i % confettiColors.length],
      delay: `${Math.random() * 1.5}s`,
      duration: `${2 + Math.random() * 2}s`,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));

    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full relative overflow-hidden">
        {/* Confetti */}
        <style>{`
          @keyframes confettiFall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}</style>
        {confettiPieces.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.left,
              top: -10,
              width: p.size,
              height: p.size * 1.5,
              backgroundColor: p.color,
              borderRadius: 1,
              animation: `confettiFall ${p.duration} ${p.delay} ease-out forwards`,
              transform: `rotate(${p.rotation}deg)`,
              zIndex: 60,
              pointerEvents: 'none',
            }}
          />
        ))}
        <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.End} padding={4} className="shrink-0">
          <ButtonIcon iconName={IconName.Close} ariaLabel="Close" size={ButtonIconSize.Sm} onClick={handleGoToWallet} />
        </Box>
        <Box className="flex-1 overflow-y-auto flex flex-col items-center" paddingHorizontal={4}>
          <img src={successPhoneImage} alt="" style={{ width: 140, height: 140, objectFit: 'contain', marginBottom: 12 }} />
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold} className="text-center">{t('twoFASuccessTitle')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 text-center">{t('twoFASuccessSubtitle')}</Text>

          {/* Configured factors — single list like JasonBorg */}
          <Box className="w-full mt-4">
            <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.TextMuted}
              className="mb-2 uppercase tracking-wider"
            >
              {t('twoFAConfiguredFactors')}
            </Text>
            <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-xl" flexDirection={BoxFlexDirection.Column}>
              {allConfigured.map((cf, i) => {
                const fo = ALL_FACTORS.find((f) => f.id === cf.id);
                return (
                  <Box
                    key={`${cf.id}-${cf.role}`}
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    paddingVertical={3}
                    paddingHorizontal={3}
                    gap={3}
                    borderColor={BoxBorderColor.BorderMuted}
                    className={i < allConfigured.length - 1 ? 'border-b' : ''}
                  >
                    <Box backgroundColor={BoxBackgroundColor.SuccessMuted} className="rounded-full p-1.5 shrink-0">
                      <Icon name={fo?.icon || IconName.Lock} color={IconColor.SuccessDefault} size={IconSize.Sm} />
                    </Box>
                    <Box className="flex-1">
                      <Text fontWeight={FontWeight.Medium} variant={TextVariant.BodyMd}>{fo ? t(fo.nameKey) : ''}</Text>
                      <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{cf.role}</Text>
                    </Box>
                    <Icon name={IconName.Check} color={IconColor.SuccessDefault} size={IconSize.Sm} />
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Info banner */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={3}
            padding={3}
            backgroundColor={BoxBackgroundColor.BackgroundMuted}
            className="rounded-xl w-full mt-4 mb-4"
          >
            <Icon name={IconName.Info} color={IconColor.IconMuted} size={IconSize.Sm} className="shrink-0 mt-0.5" />
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
              {t('twoFASuccessInfoBanner')}
            </Text>
          </Box>
        </Box>
        <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted} flexDirection={BoxFlexDirection.Column} gap={2}>
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onClick={handleGoToWallet}>{t('twoFAGoToWallet')}</Button>
        </Box>
      </Box>
    );
  }

  return null;
};

export default Setup2FAPage;
