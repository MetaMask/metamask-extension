import React, { useState, useCallback, useRef } from 'react';
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
import { ACCOUNT_LIST_PAGE_ROUTE } from '../../helpers/constants/routes';

type FactorId = 'email' | 'sms' | 'social' | 'authenticator' | 'passkeys' | 'mobile';

type ConfiguredFactor = {
  id: FactorId;
  detail: string;
  role: 'signing' | 'recovery';
};

const FACTOR_META: Record<FactorId, { nameKey: string; icon: IconName }> = {
  email: { nameKey: 'twoFAFactorEmailOtp', icon: IconName.Mail },
  sms: { nameKey: 'twoFAFactorSmsOtp', icon: IconName.Sms },
  social: { nameKey: 'twoFAFactorSocialLogin', icon: IconName.Global },
  authenticator: { nameKey: 'twoFAFactorAuthenticator', icon: IconName.SecurityKey },
  mobile: { nameKey: 'twoFAFactorMobileDevice', icon: IconName.Mobile },
  passkeys: { nameKey: 'twoFAFactorPasskeys', icon: IconName.Fingerprint },
};

const ALL_FACTOR_IDS: FactorId[] = ['email', 'authenticator', 'social', 'mobile', 'passkeys', 'sms'];

function getStoredFactors(): ConfiguredFactor[] {
  try {
    const raw = localStorage.getItem('mm-2fa-configured-factors');
    return raw ? JSON.parse(raw) : [
      { id: 'email', detail: 'n***@gmail.com', role: 'signing' },
      { id: 'authenticator', detail: 'TOTP configured', role: 'recovery' },
    ];
  } catch {
    return [
      { id: 'email', detail: 'n***@gmail.com', role: 'signing' },
      { id: 'authenticator', detail: 'TOTP configured', role: 'recovery' },
    ];
  }
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

// ─── Setup Modal (reused from setup flow) ────────────────────────────

function SetupModal({ factorId, onComplete, onClose, t }: {
  factorId: FactorId; onComplete: (detail: string) => void; onClose: () => void; t: (key: string) => string;
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

  if (factorId === 'email' || factorId === 'sms') {
    const isEmail = factorId === 'email';
    if (subStep === 'input') {
      return (
        <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
          {header}
          <Box className="flex-1" paddingHorizontal={4}>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t(isEmail ? 'twoFAEnterYourEmail' : 'twoFAEnterYourPhone')}</Text>
            <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t(isEmail ? 'twoFAEnterEmailSubtitle' : 'twoFAEnterPhoneSubtitle')}</Text>
            <FormTextField label={t(isEmail ? 'twoFAEmailLabel' : 'twoFAPhoneLabel')} placeholder={t(isEmail ? 'twoFAEmailPlaceholder' : 'twoFAPhonePlaceholder')} size={FormTextFieldSize.Lg}
              value={inputValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)} autoFocus />
          </Box>
          <Box padding={4} className="shrink-0">
            <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={isEmail ? !inputValue.includes('@') : inputValue.length < 6} onClick={() => setSubStep('verify')}>
              {t(isEmail ? 'twoFASendVerificationEmail' : 'twoFASendVerificationSms')}
            </Button>
          </Box>
        </Box>
      );
    }
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col">
        {header}
        <Box className="flex-1" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t(isEmail ? 'twoFAVerifyYourEmail' : 'twoFAVerifyYourPhone')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t(isEmail ? 'twoFAVerifyEmailSubtitle' : 'twoFAVerifyPhoneSubtitle')}</Text>
          <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} className="mt-4">
            <TextButton onClick={() => {}}>{t('twoFAResendCode')}</TextButton>
          </Box>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!otpFilled}
            onClick={() => onComplete(isEmail ? maskEmail(inputValue) : maskPhone(inputValue))}>
            {t('twoFAVerify')}
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
            {[
              { nameKey: 'twoFAFactorGoogle', icon: IconName.Global, detail: 'Google account linked' },
              { nameKey: 'twoFAFactorApple', icon: IconName.Mobile, detail: 'Apple account linked' },
            ].map((provider) => (
              <Box key={provider.nameKey} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3} padding={4}
                borderColor={BoxBorderColor.BorderMuted} className="rounded-xl cursor-pointer hover:bg-background-default-hover" className="border"
                onClick={() => onComplete(provider.detail)}>
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

  if (factorId === 'authenticator') {
    return (
      <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="absolute inset-0 z-50 flex flex-col overflow-hidden">
        {header}
        <Box className="flex-1 overflow-y-auto overflow-x-hidden" paddingHorizontal={4}>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{t('twoFAAuthenticatorSetup')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 mb-6">{t('twoFAAuthenticatorSubtitle')}</Text>
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} alignItems={BoxAlignItems.Center}
            backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-xl mb-4" style={{ height: 160 }}>
            <Icon name={IconName.QrCode} color={IconColor.IconMuted} size={IconSize.Xl} />
          </Box>
          <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-xl px-3 py-2 mb-4" flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between}>
            <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Medium} className="font-mono break-all">XQJF-KGHT-MNPW-2R4S</Text>
            <ButtonIcon iconName={IconName.Copy} ariaLabel="Copy" size={ButtonIconSize.Sm} />
          </Box>
          <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth isDisabled={!otpFilled} onClick={() => onComplete('TOTP configured')}>
            {t('twoFAAuthenticatorVerify')}
          </Button>
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
          <Box flexDirection={BoxFlexDirection.Column} gap={3} className="mb-5">
            {[
              { num: '1', textKey: 'twoFAMobileDeviceStep1' },
              { num: '2', textKey: 'twoFAMobileDeviceStep2' },
              { num: '3', textKey: 'twoFAMobileDeviceStep3' },
            ].map((step) => (
              <Box key={step.num} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} gap={3}>
                <Box backgroundColor={BoxBackgroundColor.PrimaryMuted} className="rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.PrimaryDefault}>{step.num}</Text>
                </Box>
                <Text variant={TextVariant.BodySm}>{t(step.textKey)}</Text>
              </Box>
            ))}
          </Box>
          <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} alignItems={BoxAlignItems.Center}
            backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-xl" style={{ height: 180 }}>
            <Icon name={IconName.QrCode} color={IconColor.IconMuted} size={IconSize.Xl} />
          </Box>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onClick={() => onComplete('MetaMask Mobile linked')}>
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
          <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-5 mb-6">
            <Icon name={IconName.Fingerprint} color={IconColor.IconDefault} size={IconSize.Xl} />
          </Box>
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="text-center">{t('twoFAPasskeysSetup')}</Text>
          <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="mt-1 text-center">{t('twoFAPasskeysSubtitle')}</Text>
        </Box>
        <Box padding={4} className="shrink-0">
          <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth startIconName={IconName.Fingerprint} onClick={() => onComplete('Passkey created')}>
            {t('twoFAPasskeysCreate')}
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
}

// ─── Factor Section ──────────────────────────────────────────────────

function FactorSection({ title, subtitle, phase, configured, availableIds, canDelete, onDelete, onSetUp, onEdit, onLearnMore, t }: {
  title: string; subtitle: string; phase: 'signing' | 'recovery'; configured: ConfiguredFactor[]; availableIds: FactorId[];
  canDelete: boolean; onDelete: (id: FactorId) => void; onSetUp: (id: FactorId) => void; onEdit: (id: FactorId) => void;
  onLearnMore: () => void; t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box className="mb-6">
      <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>{title}</Text>
      <Box className="mt-1 mb-3">
        <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm} className="inline">{subtitle} </Text>
        <TextButton size={TextButtonSize.BodySm} className="inline" onClick={onLearnMore}>{t('twoFALearnMore')}</TextButton>
      </Box>

      {configured.map((factor) => {
        const meta = FACTOR_META[factor.id];
        return (
          <Box key={`${factor.id}-${factor.role}`} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center}
            paddingVertical={3} paddingHorizontal={3} gap={3} borderColor={BoxBorderColor.BorderMuted} className="border-b">
            <Box backgroundColor={BoxBackgroundColor.SuccessMuted} className="rounded-full p-1.5 shrink-0">
              <Icon name={meta.icon} color={IconColor.SuccessDefault} size={IconSize.Sm} />
            </Box>
            <Box className="flex-1 min-w-0">
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>{t(meta.nameKey)}</Text>
              <Text variant={TextVariant.BodyXs} color={TextColor.TextMuted}>{factor.detail}</Text>
            </Box>
            <Box backgroundColor={BoxBackgroundColor.SuccessMuted} className="rounded-full px-2.5 py-1">
              <Text variant={TextVariant.BodyXs} fontWeight={FontWeight.Bold} color={TextColor.SuccessDefault} className="text-[10px]">Active</Text>
            </Box>
            <Box flexDirection={BoxFlexDirection.Row} gap={1}>
              <ButtonIcon iconName={IconName.Edit} ariaLabel="Edit" size={ButtonIconSize.Sm} onClick={() => onEdit(factor.id)} />
              <ButtonIcon iconName={IconName.Trash} ariaLabel="Remove" size={ButtonIconSize.Sm}
                onClick={canDelete ? () => onDelete(factor.id) : undefined}
                className={canDelete ? '' : 'opacity-30 cursor-not-allowed'} />
            </Box>
          </Box>
        );
      })}

      {availableIds.length > 0 && (
        <Box className="mt-3">
          <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between}
            className="cursor-pointer py-2" onClick={() => setExpanded(!expanded)}>
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>{t('twoFAAvailableMethods')}</Text>
            <Icon name={expanded ? IconName.ArrowUp : IconName.ArrowDown} size={IconSize.Sm} color={IconColor.IconMuted} />
          </Box>
          {expanded && (
            <Box flexDirection={BoxFlexDirection.Column} gap={2} className="mt-1">
              {availableIds.map((factorId) => {
                const meta = FACTOR_META[factorId];
                return (
                  <Box key={factorId} flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center}
                    paddingVertical={3} paddingHorizontal={3} gap={3} borderColor={BoxBorderColor.BorderMuted} className="border-b last:border-b-0">
                    <Box backgroundColor={BoxBackgroundColor.BackgroundMuted} className="rounded-full p-1.5 shrink-0">
                      <Icon name={meta.icon} color={IconColor.IconAlternative} size={IconSize.Sm} />
                    </Box>
                    <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} className="flex-1">{t(meta.nameKey)}</Text>
                    <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={() => onSetUp(factorId)}>
                      {t('twoFASetUp')}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export const Manage2FAPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [factors, setFactors] = useState<ConfiguredFactor[]>(getStoredFactors);
  const [setupModal, setSetupModal] = useState<{ factorId: FactorId; role: 'signing' | 'recovery' } | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{ factorId: FactorId; role: 'signing' | 'recovery' } | null>(null);
  const [learnMorePhase, setLearnMorePhase] = useState<'signing' | 'recovery' | null>(null);

  const handleBack = useCallback(() => navigate(ACCOUNT_LIST_PAGE_ROUTE, { replace: true }), [navigate]);

  const signingFactors = factors.filter((f) => f.role === 'signing');
  const recoveryFactors = factors.filter((f) => f.role === 'recovery');
  const availableForSigning = ALL_FACTOR_IDS.filter((id) => !signingFactors.some((f) => f.id === id));
  const availableForRecovery = ALL_FACTOR_IDS.filter((id) => !recoveryFactors.some((f) => f.id === id));

  const handleSetupComplete = (detail: string) => {
    if (setupModal) {
      const updated = [...factors.filter((f) => !(f.id === setupModal.factorId && f.role === setupModal.role)),
        { id: setupModal.factorId, detail, role: setupModal.role }];
      setFactors(updated);
      localStorage.setItem('mm-2fa-configured-factors', JSON.stringify(updated));
      setSetupModal(null);
    }
  };

  const handleDelete = (factorId: FactorId, role: 'signing' | 'recovery') => {
    const roleFactors = factors.filter((f) => f.role === role);
    if (roleFactors.length <= 1) return;
    const updated = factors.filter((f) => !(f.id === factorId && f.role === role));
    setFactors(updated);
    localStorage.setItem('mm-2fa-configured-factors', JSON.stringify(updated));
  };

  return (
    <Box backgroundColor={BoxBackgroundColor.BackgroundDefault} className="flex flex-col h-full relative">
      <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center} justifyContent={BoxJustifyContent.Between} padding={4} className="shrink-0">
        <ButtonIcon iconName={IconName.ArrowLeft} ariaLabel="Back" size={ButtonIconSize.Sm} onClick={handleBack} />
        <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>{t('twoFAManageWallet')}</Text>
        <Box className="w-8" />
      </Box>

      <Box className="flex-1 overflow-y-auto" paddingHorizontal={4}>
        <FactorSection
          title={t('twoFASigningMethods')}
          subtitle={t('twoFAChooseSigningMethod')}
          phase="signing"
          configured={signingFactors}
          availableIds={availableForSigning}
          canDelete={signingFactors.length > 1}
          onDelete={(id) => setDeleteWarning({ factorId: id, role: 'signing' })}
          onSetUp={(id) => setSetupModal({ factorId: id, role: 'signing' })}
          onEdit={(id) => setSetupModal({ factorId: id, role: 'signing' })}
          onLearnMore={() => setLearnMorePhase('signing')}
          t={t}
        />

        <Box borderColor={BoxBorderColor.BorderMuted} className="border-t mb-6" />

        <FactorSection
          title={t('twoFARecoveryMethods')}
          subtitle={t('twoFARecoveryPickerSubtitleNew')}
          phase="recovery"
          configured={recoveryFactors}
          availableIds={availableForRecovery}
          canDelete={recoveryFactors.length > 1}
          onDelete={(id) => setDeleteWarning({ factorId: id, role: 'recovery' })}
          onSetUp={(id) => setSetupModal({ factorId: id, role: 'recovery' })}
          onEdit={(id) => setSetupModal({ factorId: id, role: 'recovery' })}
          onLearnMore={() => setLearnMorePhase('recovery')}
          t={t}
        />
      </Box>

      {setupModal && (
        <SetupModal
          factorId={setupModal.factorId}
          onComplete={handleSetupComplete}
          onClose={() => setSetupModal(null)}
          t={t}
        />
      )}

      {/* Delete Warning Modal */}
      {deleteWarning && (
        <Box className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'var(--color-overlay-default)' }}>
          <Box
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
            className="rounded-2xl mx-6 max-w-sm w-full"
            padding={6}
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
          >
            <Box backgroundColor={BoxBackgroundColor.ErrorMuted} className="rounded-full p-4 mb-4">
              <Icon name={IconName.Danger} color={IconColor.ErrorDefault} size={IconSize.Xl} />
            </Box>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="text-center mb-2">
              {t('twoFADeleteWarningTitle')}
            </Text>
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative} className="text-center mb-6">
              {t('twoFADeleteWarningBody')}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={2} className="w-full">
              <Button variant={ButtonVariant.Primary} isDanger size={ButtonSize.Lg} isFullWidth
                onClick={() => { handleDelete(deleteWarning.factorId, deleteWarning.role); setDeleteWarning(null); }}>
                {t('twoFADeleteWarningConfirm')}
              </Button>
              <Button variant={ButtonVariant.Secondary} size={ButtonSize.Lg} isFullWidth onClick={() => setDeleteWarning(null)}>
                {t('twoFADeleteWarningCancel')}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Learn More Bottom Sheet */}
      {learnMorePhase && (
        <Box className="absolute inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: 'var(--color-overlay-default)' }} onClick={() => setLearnMorePhase(null)}>
          <Box
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
            className="rounded-t-2xl"
            padding={4}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Box flexDirection={BoxFlexDirection.Row} justifyContent={BoxJustifyContent.Center} className="mb-3">
              <Box className="w-9 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border-default)' }} />
            </Box>
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold} className="mb-3">
              {learnMorePhase === 'signing' ? t('twoFALearnMoreSigningTitle') : t('twoFALearnMoreRecoveryTitle')}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={3} className="mb-5">
              {(learnMorePhase === 'signing' ? [
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
            <Button variant={ButtonVariant.Primary} size={ButtonSize.Lg} isFullWidth onClick={() => setLearnMorePhase(null)}>
              {t('twoFAGotIt')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Manage2FAPage;
