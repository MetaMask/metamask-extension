import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
import { getIsSocialLoginFlow } from '../../selectors';
import { ACCOUNT_LIST_PAGE_ROUTE, DEFAULT_ROUTE, MANAGE_2FA_ROUTE } from '../../helpers/constants/routes';

const successPhoneImage = './images/2fa-success-phone.png';

type FactorId = 'email' | 'sms' | 'social' | 'authenticator' | 'passkeys' | 'mobile';

const FACTOR_META: Record<FactorId, { nameKey: string; icon: IconName }> = {
  email: { nameKey: 'twoFAFactorEmailOtp', icon: IconName.Mail },
  sms: { nameKey: 'twoFAFactorSmsOtp', icon: IconName.Sms },
  social: { nameKey: 'twoFAFactorSocialLogin', icon: IconName.Global },
  authenticator: { nameKey: 'twoFAFactorAuthenticator', icon: IconName.SecurityKey },
  passkeys: { nameKey: 'twoFAFactorPasskeys', icon: IconName.Fingerprint },
  mobile: { nameKey: 'twoFAFactorMobileDevice', icon: IconName.Mobile },
};

const RECOVERY_FACTORS: FactorId[] = ['mobile', 'social', 'email', 'sms'];
const ALL_FACTORS: FactorId[] = ['mobile', 'social', 'authenticator', 'passkeys', 'email', 'sms'];
const NON_SOCIAL_RECOVERY_FACTORS: FactorId[] = ['mobile', 'email', 'sms'];

type Step = 'intro' | 'identity-pick' | 'identity-verify' | 'second-pick' | 'second-verify' | 'recovery-pick' | 'recovery-verify' | 'recovering' | 'success';

function getProgressStage(step: Step): number {
  if (step === 'identity-pick' || step === 'identity-verify') return 1;
  if (step === 'second-pick' || step === 'second-verify') return 2;
  return 0;
}

// ─── Shared Components ───────────────────────────────────────────────

function RecoveryHeader({ onBack, onClose, title, t }: { onBack: () => void; onClose: () => void; title?: string; t: (key: string) => string }) {
  return (
    <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between} padding={4} className="shrink-0">
      <ButtonIcon iconName={IconName.ArrowLeft} ariaLabel="Back" size={ButtonIconSize.Sm} onClick={onBack} />
      {title ? <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>{title}</Text> : <Box className="w-8" />}
      <ButtonIcon iconName={IconName.Close} ariaLabel="Close" size={ButtonIconSize.Sm} onClick={onClose} />
    </Box>
  );
}

function RecoveryProgress({ stage, singleStep, t }: { stage: number; singleStep?: boolean; t: (key: string) => string }) {
  const steps = singleStep
    ? [{ key: 'twoFARecoverStepRecoveryFactor', stageNum: 1 }]
    : [
        { key: 'twoFARecoverStepCloud', stageNum: 1 },
        { key: 'twoFARecoverStepSecond', stageNum: 2 },
      ];
  return (
    <Box flexDirection={BoxFlexDirection.Row} paddingHorizontal={4} paddingBottom={3} gap={2} className="shrink-0">
      {steps.map((step, i) => {
        const isActive = stage === step.stageNum;
        const isCompleted = stage > step.stageNum;
        return (
          <Box key={i} className="flex-1" flexDirection={BoxFlexDirection.Column} alignItems={BoxAlignItems.Start}>
            <Box className="w-full rounded-full" style={{
              height: 3,
              backgroundColor: isActive || isCompleted ? 'var(--color-primary-default)' : 'var(--color-border-muted)',
              opacity: isCompleted ? 0.4 : 1,
            }} />
            <Text variant={TextVariant.BodyXs} fontWeight={isActive ? FontWeight.Bold : FontWeight.Medium}
              color={isActive ? TextColor.TextDefault : TextColor.TextMuted} className="pt-1.5">
              {t(step.key)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

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

// ─── Factor Verification Modal ───────────────────────────────────────

function VerifyFactorModal({ factorId, onVerified, onClose, t }: {
  factorId: FactorId; onVerified: () => void; onClose: () => void; t: (key: string) => string;
}) {
  const [subStep, setSubStep] = useState<'input' | 'verify'>('input');
  const [inputValue, setInputValue] = useState('');
  const [otpFilled, setOtpFilled] = useState(false);
  const meta = FACTOR_META[factorId];

  const header = (
    <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between} padding={4} className="shrink-0">
      <ButtonIcon iconName={IconName.ArrowLeft} ariaLabel="Back" size={ButtonIconSize.Sm}
        onClick={() => { if (subStep === 'verify') setSubStep('input'); else onClose(); }} />
      <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>{t(meta.nameKey)}</Text>
      <ButtonIcon iconName={IconName.Close} ariaLabel="Close" size={ButtonIconSize.Sm} onClick={onClose} />
    </Box>
  );

  // Email / SMS — input + OTP
  if (factorId === 'email' || factorId === 'sms') {
    const isEmail = factorId === 'email';
    if (subStep === 'input') {
      return (
        <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
          {header}
          <Box className="flex-1" paddingHorizontal={4}>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
              {isEmail ? t('twoFAEnterYourEmail') : t('twoFAEnterYourPhone')}
            </Text>
            <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">
              {isEmail ? t('twoFAEnterEmailSubtitle') : t('twoFAEnterPhoneSubtitle')}
            </Text>
            <FormTextField label={t(isEmail ? 'twoFAEmailLabel' : 'twoFAPhoneLabel')}
              id={isEmail ? 'recover-2fa-email' : 'recover-2fa-phone'}
              placeholder={t(isEmail ? 'twoFAEmailPlaceholder' : 'twoFAPhonePlaceholder')}
              size={FormTextFieldSize.Lg} value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)} autoFocus />
          </Box>
          <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
            <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth
              isDisabled={isEmail ? !inputValue.includes('@') : inputValue.length < 6}
              onClick={() => setSubStep('verify')}>
              {t('twoFARecoverVerifyFactor')}
            </Button>
          </Box>
        </Box>
      );
    }
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
            {isEmail ? t('twoFAVerifyYourEmail') : t('twoFAVerifyYourPhone')}
          </Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">
            {isEmail ? t('twoFAVerifyEmailSubtitle') : t('twoFAVerifyPhoneSubtitle')}
          </Text>
          <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} className="mt-4">
            <TextButton size={TextButtonSize.BodySm} onClick={() => {}}>{t('twoFAResendCode')}</TextButton>
          </Box>
        </Box>
        <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!otpFilled} onClick={onVerified}>
            {t('twoFAVerify')}
          </Button>
        </Box>
      </Box>
    );
  }

  // Social Login — provider picker
  if (factorId === 'social') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAFactorSocialLogin')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFASocialPickProvider')}</Text>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            {[
              { nameKey: 'twoFAFactorGoogle', icon: IconName.Global },
              { nameKey: 'twoFAFactorApple', icon: IconName.Mobile },
            ].map((provider) => (
              <Box key={provider.nameKey} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3} padding={4}
                borderColor={BoxBorderColor.BorderMuted} className="rounded-xl border cursor-pointer hover:bg-background-default-hover"
                onClick={onVerified}>
                <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-1.5 shrink-0">
                  <Icon name={provider.icon} color={IconColor.IconDefault} size={IconSize.Sm} />
                </Box>
                <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} className="flex-1">{t(provider.nameKey)}</Text>
                <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconMuted} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // Authenticator — OTP only
  if (factorId === 'authenticator') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAAuthenticatorVerify')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">
            {t('twoFAAuthenticatorSubtitle')}
          </Text>
          <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
        </Box>
        <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!otpFilled} onClick={onVerified}>
            {t('twoFAVerify')}
          </Button>
        </Box>
      </Box>
    );
  }

  // Mobile — QR based action (matches setup flow)
  if (factorId === 'mobile') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAFactorMobileDevice')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">
            {t('twoFARecoverMobileDeviceSubtitle')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
            backgroundColor={BoxBackgroundColor.BackgroundMuted}
            className="rounded-xl"
            style={{ height: 180 }}
          >
            <Icon name={IconName.QrCode} color={IconColor.IconMuted} size={IconSize.Xl} />
          </Box>
        </Box>
        <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth startIconName={IconName.Mobile} onClick={onVerified}>
            {t('twoFAVerify')}
          </Button>
        </Box>
      </Box>
    );
  }

  // Passkeys — single action
  return (
    <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
      {header}
      <Box className="flex-1 flex flex-col items-center justify-center" paddingHorizontal={4}>
        <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-3 mb-4">
          <Icon name={meta.icon} color={IconColor.IconDefault} size={IconSize.Xl} />
        </Box>
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="text-center">{t(meta.nameKey)}</Text>
        <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 text-center">
          {t('twoFAPasskeysSubtitle')}
        </Text>
      </Box>
      <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
        <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth startIconName={meta.icon} onClick={onVerified}>
          {t('twoFAVerify')}
        </Button>
      </Box>
    </Box>
  );
}

// ─── Factor Picker Screen ────────────────────────────────────────────

function FactorPickerScreen({ title, subtitle, note, factors, onSelect, onBack, onClose, stage, singleStep, t }: {
  title: string; subtitle: string; note?: string; factors: FactorId[];
  onSelect: (id: FactorId) => void; onBack: () => void; onClose: () => void;
  stage: number; singleStep?: boolean; t: (key: string) => string;
}) {
  return (
    <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full">
      <RecoveryHeader onBack={onBack} onClose={onClose} title={t('twoFARecover2FAWallet')} t={t} />
      <RecoveryProgress stage={stage} singleStep={singleStep} t={t} />
      <Box className="flex-1 overflow-y-auto" paddingHorizontal={4}>
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{title}</Text>
        <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-4">{subtitle}</Text>
        {note && (
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={2}
            padding={3}
            backgroundColor={BoxBackgroundColor.InfoMuted}
            className="rounded-xl mb-4"
          >
            <Icon name={IconName.Info} color={IconColor.InfoDefault} size={IconSize.Sm} className="shrink-0 mt-0.5" />
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>{note}</Text>
          </Box>
        )}
        <Box flexDirection={BoxFlexDirection.Column}>
          {factors.map((factorId) => {
            const meta = FACTOR_META[factorId];
            return (
              <Box key={factorId} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center}
                paddingVertical={3} paddingHorizontal={3} gap={3}
                borderColor={BoxBorderColor.BorderMuted} className="border-b last:border-b-0">
                <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-1.5 shrink-0">
                  <Icon name={meta.icon} color={IconColor.IconAlternative} size={IconSize.Sm} />
                </Box>
                <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} className="flex-1">{t(meta.nameKey)}</Text>
                <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={() => onSelect(factorId)}>
                  {t('twoFARecoverVerifyFactor')}
                </Button>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export const Recover2FAPage: React.FC = () => {
  const t = useI18nContext() as (key: string) => string;
  const navigate = useNavigate();

  const isSocialUser = useSelector(getIsSocialLoginFlow);

  // Social users skip identity verification (already verified by social login)
  // and continue with a non-social recovery factor.
  const socialRecoveryFactors: FactorId[] = NON_SOCIAL_RECOVERY_FACTORS;

  const [step, setStep] = useState<Step>('intro');
  const [identityFactor, setIdentityFactor] = useState<FactorId | null>(null);
  const [verifyModalFactor, setVerifyModalFactor] = useState<FactorId | null>(null);
  const [availableSigningFactors, setAvailableSigningFactors] = useState<FactorId[]>([]);

  const handleClose = useCallback(() => navigate(ACCOUNT_LIST_PAGE_ROUTE, { replace: true }), [navigate]);
  const handleGoToWallet = useCallback(() => {
    localStorage.setItem('mm-2fa-wallet-created', 'true');
    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navigate]);

  const handleBack = useCallback(() => {
    const backMap: Partial<Record<Step, Step>> = {
      'identity-pick': 'intro',
      'second-pick': 'identity-pick',
      'recovery-pick': 'intro',
    };
    const prev = backMap[step];
    if (prev) { setStep(prev); setVerifyModalFactor(null); }
    else navigate(ACCOUNT_LIST_PAGE_ROUTE, { replace: true });
  }, [step, navigate]);

  useEffect(() => {
    if (step === 'recovering') {
      const timer = setTimeout(() => setStep('success'), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [step]);

  const handleIdentityVerified = useCallback(() => {
    if (verifyModalFactor) {
      const retrievedSigningFactors = (() => {
        try {
          const stored = JSON.parse(localStorage.getItem('mm-2fa-configured-signing') || '[]') as FactorId[];
          return ALL_FACTORS.filter((id) => stored.includes(id));
        } catch {
          return [];
        }
      })();

      setAvailableSigningFactors(retrievedSigningFactors);
      setIdentityFactor(verifyModalFactor);
      setVerifyModalFactor(null);
      setStep('second-pick');
    }
  }, [verifyModalFactor]);

  const handleSecondVerified = useCallback(() => {
    if (verifyModalFactor) {
      setVerifyModalFactor(null);
      setStep('recovering');
    }
  }, [verifyModalFactor]);

  const handleRecoveryFactorVerified = useCallback(() => {
    if (verifyModalFactor) {
      setVerifyModalFactor(null);
      setStep('recovering');
    }
  }, [verifyModalFactor]);

  const secondFactors = availableSigningFactors.filter((id) => id !== identityFactor);

  // ─── Intro ─────────────────────────────────────────────────────────

  if (step === 'intro') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full">
        <RecoveryHeader onBack={handleClose} onClose={handleClose} t={t} />
        <Box className="flex-1 flex flex-col items-center justify-center" paddingHorizontal={4}>
          <img src={successPhoneImage} alt="" style={{ width: 160, height: 160, objectFit: 'contain' }} className="mb-6" />
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold} className="text-center">
            {t('twoFARecoverIntroTitle')}
          </Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-2 text-center max-w-xs">
            {t('twoFARecoverIntroBody')}
          </Text>
        </Box>
        <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted}>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={() => setStep(isSocialUser ? 'recovery-pick' : 'identity-pick')}
          >
            {t('twoFAStartRecovery')}
          </Button>
        </Box>
      </Box>
    );
  }

  // ─── Step 1: Identity Verification Picker ──────────────────────────

  if (step === 'identity-pick') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full relative">
        <FactorPickerScreen
          title={t('twoFARecoverVerifyIdentity')}
          subtitle={t('twoFARecoverVerifyIdentitySubtitle')}
          factors={RECOVERY_FACTORS}
          onSelect={(id) => { setVerifyModalFactor(id); }}
          onBack={handleBack}
          onClose={handleClose}
          stage={getProgressStage(step)}
          t={t}
        />
        {verifyModalFactor && (
          <VerifyFactorModal factorId={verifyModalFactor} onVerified={handleIdentityVerified}
            onClose={() => setVerifyModalFactor(null)} t={t} />
        )}
      </Box>
    );
  }

  // ─── Step 2: Second Factor Picker ──────────────────────────────────

  if (step === 'second-pick') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full relative">
        <FactorPickerScreen
          title={t('twoFARecoverSecondFactorTitle')}
          subtitle={t('twoFARecoverSecondFactorSubtitle')}
          factors={secondFactors}
          onSelect={(id) => { setVerifyModalFactor(id); }}
          onBack={handleBack}
          onClose={handleClose}
          stage={getProgressStage(step)}
          t={t}
        />
        {verifyModalFactor && (
          <VerifyFactorModal factorId={verifyModalFactor} onVerified={handleSecondVerified}
            onClose={() => setVerifyModalFactor(null)} t={t} />
        )}
      </Box>
    );
  }

  // ─── Social Login: Single-Step Recovery Factor Picker ──────────────

  if (step === 'recovery-pick') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full relative">
        <FactorPickerScreen
          title={t('twoFARecoverRecoveryFactorTitle')}
          subtitle={t('twoFARecoverRecoveryFactorSubtitle')}
          note={t('twoFARecoverSocialNote')}
          factors={socialRecoveryFactors}
          onSelect={(id) => setVerifyModalFactor(id)}
          onBack={handleBack}
          onClose={handleClose}
          stage={1}
          singleStep
          t={t}
        />
        {verifyModalFactor && (
          <VerifyFactorModal
            factorId={verifyModalFactor}
            onVerified={handleRecoveryFactorVerified}
            onClose={() => setVerifyModalFactor(null)}
            t={t}
          />
        )}
      </Box>
    );
  }

  // ─── Recovering ────────────────────────────────────────────────────

  if (step === 'recovering') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full items-center justify-center" paddingHorizontal={4}>
        <Box className="mb-4">
          <Icon name={IconName.Loading} color={IconColor.PrimaryDefault} size={IconSize.Xl} className="animate-spin" />
        </Box>
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="text-center">
          {t('twoFARecovering')}
        </Text>
        <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 text-center">
          {t('twoFARecoveringSubtitle')}
        </Text>
      </Box>
    );
  }

  // ─── Success ───────────────────────────────────────────────────────

  if (step === 'success') {
    const confettiColors = ['var(--color-primary-default)', 'var(--color-success-default)', 'var(--color-error-default)', 'var(--color-warning-default)', 'var(--color-primary-alternative)', 'var(--color-info-default)', 'var(--color-accent01-normal)'];
    const confettiPieces = Array.from({ length: 40 }).map((_, i) => ({
      id: i, left: `${Math.random() * 100}%`, color: confettiColors[i % confettiColors.length],
      delay: `${Math.random() * 1.5}s`, duration: `${2 + Math.random() * 2}s`,
      size: 4 + Math.random() * 6, rotation: Math.random() * 360,
    }));

    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full relative overflow-hidden">
        <style>{`@keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
        {confettiPieces.map((p) => (
          <div key={p.id} style={{
            position: 'absolute', left: p.left, top: -10, width: p.size, height: p.size * 1.5,
            backgroundColor: p.color, borderRadius: 1, animation: `confettiFall ${p.duration} ${p.delay} ease-out forwards`,
            transform: `rotate(${p.rotation}deg)`, zIndex: 60, pointerEvents: 'none',
          }} />
        ))}
        <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.End} padding={4} className="shrink-0">
          <ButtonIcon iconName={IconName.Close} ariaLabel="Close" size={ButtonIconSize.Sm} onClick={handleGoToWallet} />
        </Box>
        <Box className="flex-1 flex flex-col items-center justify-center" paddingHorizontal={4}>
          <img src={successPhoneImage} alt="" style={{ width: 140, height: 140, objectFit: 'contain' }} className="mb-4" />
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold} className="text-center">
            {t('twoFARecoverSuccessTitle')}
          </Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 text-center max-w-xs">
            {t('twoFARecoverSuccessBody')}
          </Text>
          <Box flexDirection={BoxFlexDirection.Row} gap={3} padding={3} backgroundColor={BoxBackgroundColor.BackgroundMuted}
            className="rounded-xl w-full mt-4">
            <Icon name={IconName.Info} color={IconColor.IconMuted} size={IconSize.Sm} className="shrink-0 mt-0.5" />
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
              {t('twoFARecoverSuccessInfo')}
            </Text>
          </Box>
        </Box>
        <Box padding={4} className="shrink-0 border-t" borderColor={BoxBorderColor.BorderMuted} flexDirection={BoxFlexDirection.Column} gap={2}>
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onClick={handleGoToWallet}>
            {t('twoFAGoToWallet')}
          </Button>
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center}>
            <TextButton size={TextButtonSize.BodySm} onClick={() => navigate(MANAGE_2FA_ROUTE)}>
              {t('twoFARecoverManageFactors')}
            </TextButton>
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
};

export default Recover2FAPage;
