import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
  TextField,
  TextFieldSize,
} from '../../../component-library';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveAccount } from '../../../../hooks/perps/stream';
import { usePerpsWithdraw } from '../hooks/usePerpsWithdraw';

const WITHDRAW_PRESETS = [25, 50, 100] as const;

type WithdrawFundsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function formatPresetAmount(value: number): string {
  if (value < 0.01 && value > 0) {
    return value.toFixed(6);
  }
  return value.toFixed(2);
}

function isAllowedAmountInput(value: string): boolean {
  return /^\d*\.?\d{0,6}$/u.test(value);
}

export const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const { account } = usePerpsLiveAccount();
  const { trigger, isLoading, error, resetError } = usePerpsWithdraw();

  const [amount, setAmount] = useState('');

  const availableBalance = useMemo(
    () => parseFloat(account?.availableBalance ?? '0') || 0,
    [account?.availableBalance],
  );

  const amountNum = useMemo(() => parseFloat(amount) || 0, [amount]);
  const hasAmount = amount.length > 0;
  const isInsufficient = hasAmount && amountNum > availableBalance;
  const isInvalidAmount = hasAmount && amountNum <= 0;

  const validationError = useMemo(() => {
    if (isInvalidAmount) {
      return t('insufficientBalance');
    }
    if (isInsufficient) {
      return t('insufficientFunds');
    }
    return null;
  }, [isInvalidAmount, isInsufficient, t]);

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      resetError();
    }
  }, [isOpen, resetError]);

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value.replace(/,/gu, '');
      if (!isAllowedAmountInput(next)) {
        return;
      }
      setAmount(next);
      if (error) {
        resetError();
      }
    },
    [error, resetError],
  );

  const handlePreset = useCallback(
    (preset: number) => {
      const next = formatPresetAmount((availableBalance * preset) / 100);
      setAmount(next);
      if (error) {
        resetError();
      }
    },
    [availableBalance, error, resetError],
  );

  const handleSubmit = useCallback(async () => {
    if (!amount || validationError) {
      return;
    }

    const result = await trigger({ amount });
    if (result.success) {
      onClose();
    }
  }, [amount, validationError, trigger, onClose]);

  const submitDisabled = isLoading || !amount || Boolean(validationError);
  const displayError = validationError ?? error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-withdraw-funds-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('perpsWithdraw')}</ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                fontWeight={FontWeight.Medium}
              >
                {t('perpsAvailableBalance')}
              </Text>
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {formatCurrencyWithMinThreshold(availableBalance, 'USD')}
              </Text>
            </Box>

            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                fontWeight={FontWeight.Medium}
              >
                {t('amount')}
              </Text>
              <TextField
                size={TextFieldSize.Md}
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full"
                disabled={isLoading}
                data-testid="perps-withdraw-amount-input"
                startAccessory={
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextAlternative}
                  >
                    $
                  </Text>
                }
              />
            </Box>

            <Box flexDirection={BoxFlexDirection.Row} gap={2}>
              {WITHDRAW_PRESETS.map((preset) => (
                <Box
                  key={`withdraw-preset-${preset}`}
                  onClick={
                    isLoading ? undefined : () => handlePreset(Number(preset))
                  }
                  className={`flex-1 py-1.5 rounded-lg bg-background-default cursor-pointer text-center hover:bg-muted-hover active:bg-muted-pressed border border-muted transition-colors duration-150${
                    isLoading ? ' opacity-50 pointer-events-none' : ''
                  }`}
                  data-testid={`perps-withdraw-preset-${preset}`}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {preset === 100 ? t('perpsMax') : `${preset}%`}
                  </Text>
                </Box>
              ))}
            </Box>

            <Text
              variant={TextVariant.BodySm}
              color={TextColor.ErrorDefault}
              data-testid="perps-withdraw-error"
              style={{ minHeight: 20 }}
            >
              {displayError ?? ''}
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelButtonProps={{
            children: t('cancel'),
            disabled: isLoading,
            'data-testid': 'perps-withdraw-cancel',
          }}
          submitButtonProps={{
            children: isLoading ? t('perpsSubmitting') : t('perpsWithdraw'),
            disabled: submitDisabled,
            'data-testid': 'perps-withdraw-submit',
          }}
        />
      </ModalContent>
    </Modal>
  );
};

export default WithdrawFundsModal;
