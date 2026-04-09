import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { ConfirmInfoSection } from '../../components/app/confirm/info/row/section';
import { ConfirmInfoRow } from '../../components/app/confirm/info/row/row';
import { ConfirmInfoRowText } from '../../components/app/confirm/info/row/text';
import { Page, Header, Content, Footer as PageFooter } from '../../components/multichain/pages/page';
import { TwoFAVerifyModal } from './twofa-verify-modal';

// ─── Mock Data ───────────────────────────────────────────────────────

const MOCK_FROM = '0x2FA0...0001';
const MOCK_BALANCE = '1.4385';
const MOCK_GAS = '0.0021';
const MOCK_TX_HASH = '0x8a3f...b7e2';

type Step = 'send' | 'review' | 'success';

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Main Component ──────────────────────────────────────────────────

export const Send2FAPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('send');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);

  const total = amount ? (parseFloat(amount) + parseFloat(MOCK_GAS)).toFixed(4) : MOCK_GAS;
  const isValidSend = recipient.length >= 6 && parseFloat(amount) > 0;

  const handleClose = useCallback(() => {
    localStorage.removeItem('mm-2fa-active');
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleConfirm = useCallback(() => {
    setShow2FAModal(true);
  }, []);

  const handle2FAConfirmed = useCallback(() => {
    setShow2FAModal(false);
    setStep('success');
  }, []);

  const handle2FACancel = useCallback(() => {
    setShow2FAModal(false);
  }, []);

  // Clean up the flag on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('mm-2fa-active');
    };
  }, []);

  // ─── Step: Send form (matches real MetaMask send screen) ──────────

  if (step === 'send') {
    return (
      <Page className="confirm_wrapper">
        <Header
          startAccessory={
            <ButtonIcon
              size={ButtonIconSize.Sm}
              ariaLabel="Back"
              iconName={IconName.ArrowLeft}
              onClick={handleClose}
            />
          }
        >
          Send
        </Header>

        <Content>
          {/* ETH token icon + label */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            paddingTop={4}
            paddingBottom={4}
          >
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #627eea 100%)',
                marginBottom: 8,
              }}
            >
              <Icon name={IconName.Ethereum} color={IconColor.iconInverse} size={IconSize.Lg} />
            </Box>
            <Text variant={TextVariant.bodyMdBold}>ETH</Text>
          </Box>

          {/* To field */}
          <Box paddingBottom={4}>
            <Text variant={TextVariant.bodyMd} paddingBottom={2}>To</Text>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              borderColor={BorderColor.borderMuted}
              borderStyle={BorderStyle.solid}
              borderRadius={BorderRadius.LG}
              padding={3}
              style={{ borderWidth: 1 }}
            >
              <input
                type="text"
                placeholder="Enter or paste an address or name"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-default)',
                  fontSize: 14,
                }}
                autoFocus
              />
              <ButtonIcon
                iconName={IconName.ScanBarcode}
                ariaLabel="Scan QR code"
                size={ButtonIconSize.Sm}
                color={IconColor.iconAlternative}
              />
            </Box>
          </Box>

          {/* Amount field */}
          <Box paddingBottom={2}>
            <Text variant={TextVariant.bodyMd} paddingBottom={2}>Amount</Text>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              borderColor={BorderColor.borderMuted}
              borderStyle={BorderStyle.solid}
              borderRadius={BorderRadius.LG}
              padding={3}
              style={{ borderWidth: 1 }}
            >
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-default)',
                  fontSize: 14,
                }}
              />
              <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
                <Text variant={TextVariant.bodySmBold}>ETH</Text>
                <Icon name={IconName.SwapVertical} size={IconSize.Sm} color={IconColor.iconAlternative} />
              </Box>
            </Box>
          </Box>

          {/* Balance line */}
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            paddingBottom={4}
          >
            <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
              $0.00
            </Text>
            <Box display={Display.Flex} gap={1}>
              <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
                {MOCK_BALANCE} ETH available
              </Text>
              <Text variant={TextVariant.bodyXs} color={TextColor.primaryDefault} style={{ cursor: 'pointer' }}>
                Max
              </Text>
            </Box>
          </Box>
        </Content>

        <PageFooter>
          <Button
            block
            size={ButtonSize.Lg}
            disabled={!isValidSend}
            onClick={() => setStep('review')}
          >
            Continue
          </Button>
        </PageFooter>
      </Page>
    );
  }

  // ─── Step: Review (matches real MetaMask confirmation) ─────────────

  if (step === 'review') {
    return (
      <Page className="confirm_wrapper">
        <Header
          startAccessory={
            <ButtonIcon
              size={ButtonIconSize.Sm}
              ariaLabel="Back"
              iconName={IconName.ArrowLeft}
              onClick={() => setStep('send')}
            />
          }
        >
          {t('twoFAReviewTitle')}
        </Header>

        <Content>
          <ConfirmInfoSection>
            <ConfirmInfoRow label={t('twoFAReviewFrom')}>
              <ConfirmInfoRowText text={MOCK_FROM} />
            </ConfirmInfoRow>
            <ConfirmInfoRow label={t('twoFAReviewTo')}>
              <ConfirmInfoRowText text={truncateAddress(recipient)} />
            </ConfirmInfoRow>
          </ConfirmInfoSection>

          <ConfirmInfoSection>
            <ConfirmInfoRow label={t('twoFAReviewAmount')}>
              <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
                <Icon name={IconName.Ethereum} color={IconColor.iconDefault} size={IconSize.Xs} />
                <ConfirmInfoRowText text={`${amount} ETH`} />
              </Box>
            </ConfirmInfoRow>
            <ConfirmInfoRow label={t('twoFAReviewGas')}>
              <ConfirmInfoRowText text={`~${MOCK_GAS} ETH`} />
            </ConfirmInfoRow>
          </ConfirmInfoSection>

          <ConfirmInfoSection>
            <ConfirmInfoRow label={t('twoFAReviewTotal')}>
              <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
                <Icon name={IconName.Ethereum} color={IconColor.iconDefault} size={IconSize.Xs} />
                <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
                  {total} ETH
                </Text>
              </Box>
            </ConfirmInfoRow>
          </ConfirmInfoSection>

          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            gap={2}
            padding={3}
            backgroundColor={BackgroundColor.warningMuted}
            style={{ borderRadius: 8 }}
          >
            <Icon name={IconName.SecurityTick} color={IconColor.warningDefault} size={IconSize.Sm} />
            <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
              {t('twoFASendSubtitle')}
            </Text>
          </Box>
        </Content>

        <PageFooter>
          <Button
            block
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={() => setStep('send')}
          >
            {t('cancel')}
          </Button>
          <Button
            block
            size={ButtonSize.Lg}
            onClick={handleConfirm}
          >
            {t('confirm')}
          </Button>
        </PageFooter>

        <TwoFAVerifyModal
          isOpen={show2FAModal}
          onConfirmed={handle2FAConfirmed}
          onCancel={handle2FACancel}
        />
      </Page>
    );
  }

  // ─── Step: Success ─────────────────────────────────────────────────

  return (
    <Page className="confirm_wrapper">
      <Header>Transaction sent</Header>

      <Content>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          paddingTop={6}
          paddingBottom={4}
        >
          <Box
            style={{ padding: 16, marginBottom: 16, borderRadius: '50%' }}
            backgroundColor={BackgroundColor.successMuted}
          >
            <Icon name={IconName.Check} color={IconColor.successDefault} size={IconSize.Xl} />
          </Box>
          <Text variant={TextVariant.headingMd} paddingBottom={1}>
            {t('twoFATxSuccessTitle')}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative} textAlign={TextAlign.Center} paddingBottom={4}>
            {t('twoFATxSuccessSubtitle').replace('$1', amount)}
          </Text>
        </Box>

        <ConfirmInfoSection>
          <ConfirmInfoRow label={t('twoFAReviewTo')}>
            <ConfirmInfoRowText text={truncateAddress(recipient)} />
          </ConfirmInfoRow>
          <ConfirmInfoRow label={t('twoFAReviewAmount')}>
            <ConfirmInfoRowText text={`${amount} ETH`} />
          </ConfirmInfoRow>
          <ConfirmInfoRow label={t('twoFATxSuccessHash')}>
            <ConfirmInfoRowText text={MOCK_TX_HASH} />
          </ConfirmInfoRow>
        </ConfirmInfoSection>

        <Box display={Display.Flex} justifyContent={JustifyContent.center} paddingTop={3}>
          <Button
            variant={ButtonVariant.Link}
            size={ButtonSize.Sm}
            startIconName={IconName.Export}
            onClick={() => {}}
          >
            {t('twoFAViewTransaction')}
          </Button>
        </Box>
      </Content>

      <PageFooter>
        <Button
          block
          size={ButtonSize.Lg}
          onClick={handleClose}
        >
          {t('twoFADone')}
        </Button>
      </PageFooter>
    </Page>
  );
};
