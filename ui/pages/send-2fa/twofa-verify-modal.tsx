import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';

type FactorId = 'email' | 'sms' | 'authenticator' | 'passkeys';

type ModalStep = 'verify' | 'signing' | 'done';

const FACTOR_META: Record<FactorId, { nameKey: string; icon: IconName }> = {
  authenticator: { nameKey: 'twoFAFactorAuthenticator', icon: IconName.SecurityKey },
  passkeys: { nameKey: 'twoFAFactorPasskeys', icon: IconName.Fingerprint },
  email: { nameKey: 'twoFAFactorEmailOtp', icon: IconName.Mail },
  sms: { nameKey: 'twoFAFactorSmsOtp', icon: IconName.Sms },
};

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
    <Box display={Display.Flex} gap={2} justifyContent={JustifyContent.center}>
      {digits.map((digit, i) => (
        <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
          value={digit} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} autoFocus={i === 0}
          style={{
            width: 44, height: 52, borderRadius: 8,
            border: digit ? '2px solid var(--color-primary-default)' : '2px solid var(--color-border-default)',
            background: 'var(--color-background-default)', color: 'var(--color-text-default)',
            fontSize: 22, fontWeight: 700, textAlign: 'center', outline: 'none',
          }}
        />
      ))}
    </Box>
  );
}

// ─── Signing Progress ────────────────────────────────────────────────

function SigningProgress({ currentPhase, t }: { currentPhase: number; t: (key: string) => string }) {
  const phases = [
    { key: 'twoFASigningStep1', icon: IconName.SecurityTick },
    { key: 'twoFASigningStep2', icon: IconName.Cloud },
    { key: 'twoFASigningStep3', icon: IconName.Send },
  ];
  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={3}>
      {phases.map((phase, i) => {
        const isDone = i < currentPhase;
        const isActive = i === currentPhase;
        return (
          <Box key={i} display={Display.Flex} alignItems={AlignItems.center} gap={3} style={{ padding: '6px 0' }}>
            <Box
              className="rounded-full"
              style={{ padding: 8 }}
              backgroundColor={isDone ? BackgroundColor.successMuted : isActive ? BackgroundColor.primaryMuted : BackgroundColor.backgroundMuted}
            >
              {isDone ? (
                <Icon name={IconName.Check} color={IconColor.successDefault} size={IconSize.Sm} />
              ) : isActive ? (
                <Icon name={IconName.Loading} color={IconColor.primaryDefault} size={IconSize.Sm} className="animate-spin" />
              ) : (
                <Icon name={phase.icon} color={IconColor.iconMuted} size={IconSize.Sm} />
              )}
            </Box>
            <Text
              variant={TextVariant.bodySm}
              color={isDone ? TextColor.successDefault : isActive ? TextColor.textDefault : TextColor.textMuted}
            >
              {t(phase.key)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Modal Component ─────────────────────────────────────────────────

export type TwoFAVerifyModalProps = {
  isOpen: boolean;
  onConfirmed: () => void;
  onCancel: () => void;
};

function getSigningFactors(): FactorId[] {
  if (typeof window === 'undefined') return ['passkeys'];
  try {
    const factorsRaw = localStorage.getItem('mm-2fa-configured-factors');
    if (factorsRaw) {
      const all: { id: FactorId; role: string }[] = JSON.parse(factorsRaw);
      const signing = all.filter((f) => f.role === 'signing').map((f) => f.id);
      if (signing.length > 0) return signing;
    }
  } catch { /* fall through */ }
  try {
    const legacyRaw = localStorage.getItem('mm-2fa-configured-signing');
    if (legacyRaw) {
      const legacy: FactorId[] = JSON.parse(legacyRaw);
      if (legacy.length > 0) return legacy;
    }
  } catch { /* fall through */ }
  return ['passkeys'];
}

export function TwoFAVerifyModal({ isOpen, onConfirmed, onCancel }: TwoFAVerifyModalProps) {
  const t = useI18nContext();
  const [modalStep, setModalStep] = useState<ModalStep>('verify');
  const [otpFilled, setOtpFilled] = useState(false);
  const [signingPhase, setSigningPhase] = useState(0);
  const [showFactorPicker, setShowFactorPicker] = useState(false);

  const configuredSigning = getSigningFactors();
  const hasMultipleFactors = configuredSigning.length > 1;

  const [selectedFactor, setSelectedFactor] = useState<FactorId>(configuredSigning[0] || 'passkeys');
  const activeMeta = FACTOR_META[selectedFactor];

  const handleSelectFactor = useCallback((factor: FactorId) => {
    setSelectedFactor(factor);
    setOtpFilled(false);
    setShowFactorPicker(false);
  }, []);

  const handleVerified = useCallback(() => {
    setModalStep('signing');
  }, []);

  useEffect(() => {
    if (modalStep !== 'signing') return;
    setSigningPhase(0);
    const timers = [
      setTimeout(() => setSigningPhase(1), 1000),
      setTimeout(() => setSigningPhase(2), 2000),
      setTimeout(() => {
        setModalStep('done');
        onConfirmed();
      }, 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [modalStep, onConfirmed]);

  useEffect(() => {
    if (isOpen) {
      setModalStep('verify');
      setOtpFilled(false);
      setSigningPhase(0);
      setShowFactorPicker(false);
      setSelectedFactor(getSigningFactors()[0] || 'passkeys');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const needsOtp = selectedFactor === 'email' || selectedFactor === 'sms' || selectedFactor === 'authenticator';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="twofa-verify-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={modalStep === 'verify' ? onCancel : undefined}>
          {modalStep === 'signing' ? t('twoFASigningTitle') : t('twoFAApproveTitle')}
        </ModalHeader>
        <ModalBody>
          {modalStep === 'verify' && (
            <Box display={Display.Flex} flexDirection={FlexDirection.Column} alignItems={AlignItems.center} gap={4}>
              <Box
                className="rounded-full"
                style={{ padding: 16 }}
                backgroundColor={BackgroundColor.primaryMuted}
              >
                <Icon name={IconName.SecurityTick} color={IconColor.primaryDefault} size={IconSize.Xl} />
              </Box>
              <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative} textAlign={TextAlign.Center}>
                {t('twoFAApproveSubtitle')}
              </Text>

              {!showFactorPicker && (
                <>
                  {/* Active factor chip */}
                  <Box
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    gap={2}
                    style={{ padding: '8px 12px', borderRadius: 8 }}
                    backgroundColor={BackgroundColor.backgroundMuted}
                    width={BlockSize.Full}
                  >
                    <Icon name={activeMeta.icon} color={IconColor.iconAlternative} size={IconSize.Sm} />
                    <Text variant={TextVariant.bodySm}>
                      {t('twoFAApproveVerifyWith').replace('$1', t(activeMeta.nameKey))}
                    </Text>
                  </Box>

                  {/* Factor-specific verification UI */}
                  {needsOtp && (
                    <Box width={BlockSize.Full}>
                      <OtpInput onCodeChange={(_code, full) => setOtpFilled(full)} />
                    </Box>
                  )}

                  {!needsOtp && (
                    <Box display={Display.Flex} flexDirection={FlexDirection.Column} alignItems={AlignItems.center} gap={2}>
                      <Icon name={activeMeta.icon} color={IconColor.primaryDefault} size={IconSize.Xl} />
                      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative} textAlign={TextAlign.Center}>
                        {t('twoFAPasskeysSubtitle')}
                      </Text>
                    </Box>
                  )}

                  {hasMultipleFactors && (
                    <Button
                      variant={ButtonVariant.Link}
                      size={ButtonSize.Sm}
                      onClick={() => setShowFactorPicker(true)}
                    >
                      {t('twoFAUseAnotherMethod')}
                    </Button>
                  )}
                </>
              )}

              {showFactorPicker && (
                <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2} width={BlockSize.Full}>
                  <Text variant={TextVariant.bodySmBold} color={TextColor.textAlternative}>
                    {t('twoFAUseAnotherMethod')}
                  </Text>
                  {configuredSigning.map((factor) => {
                    const meta = FACTOR_META[factor];
                    return (
                      <Box
                        key={factor}
                        display={Display.Flex}
                        alignItems={AlignItems.center}
                        gap={2}
                        width={BlockSize.Full}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                        backgroundColor={BackgroundColor.backgroundMuted}
                        onClick={() => handleSelectFactor(factor)}
                      >
                        <Icon
                          name={meta.icon}
                          color={IconColor.iconAlternative}
                          size={IconSize.Sm}
                        />
                        <Text
                          variant={TextVariant.bodySm}
                          color={TextColor.textDefault}
                          style={{ flex: 1 }}
                        >
                          {t(meta.nameKey)}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {modalStep === 'signing' && (
            <Box display={Display.Flex} flexDirection={FlexDirection.Column} alignItems={AlignItems.center} gap={4}>
              <Box
                className="rounded-full animate-pulse"
                style={{ padding: 16 }}
                backgroundColor={BackgroundColor.primaryMuted}
              >
                <Icon name={IconName.SecurityTick} color={IconColor.primaryDefault} size={IconSize.Xl} />
              </Box>
              <Text variant={TextVariant.bodySm} color={TextColor.textAlternative} textAlign={TextAlign.Center}>
                {t('twoFASigningSubtitle')}
              </Text>
              <SigningProgress currentPhase={signingPhase} t={t} />
            </Box>
          )}
        </ModalBody>

        {modalStep === 'verify' && !showFactorPicker && (
          <ModalFooter>
            <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4} width={BlockSize.Full}>
              <Button
                block
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                onClick={onCancel}
              >
                {t('cancel')}
              </Button>
              <Button
                block
                size={ButtonSize.Lg}
                disabled={needsOtp && !otpFilled}
                onClick={handleVerified}
                startIconName={activeMeta.icon}
              >
                {t('twoFAVerify')}
              </Button>
            </Box>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
