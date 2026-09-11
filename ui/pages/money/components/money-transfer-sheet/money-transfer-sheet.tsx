import React, { useCallback, useMemo } from 'react';
import {
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Tag,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMoneyAccountWithdrawal } from '../../../../hooks/money/useMoneyAccountWithdrawal';
import { useMoneyPerpsDeposit } from '../../../../hooks/money/useMoneyPerpsDeposit';

export const MONEY_TRANSFER_SHEET_TEST_IDS = {
  container: 'money-transfer-sheet',
  betweenAccounts: 'money-transfer-between-accounts',
  perpsAccount: 'money-transfer-perps-account',
  sendExternal: 'money-transfer-send-external',
  withdrawToBank: 'money-transfer-withdraw-to-bank',
} as const;

type MoneyTransferOption = {
  label: string;
  icon: IconName;
  testId: string;
  onPress?: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
};

export type MoneyTransferSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Money home “Send funds to” sheet — mirrors mobile `MoneyTransferSheet`.
 * “Perps account” opens the Perps deposit confirmation funded from the money
 * account; destination is chosen on the confirmation via the perps picker.
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 */
export function MoneyTransferSheet({
  isOpen,
  onClose,
}: MoneyTransferSheetProps) {
  const t = useI18nContext();
  const { initiateWithdrawal, isLoading: isWithdrawLoading } =
    useMoneyAccountWithdrawal();
  const {
    isEnabled: isPerpsEnabled,
    isEligible: isPerpsEligible,
    initiatePerpsDeposit,
    isLoading: isPerpsLoading,
  } = useMoneyPerpsDeposit();

  const isBusy = isWithdrawLoading || isPerpsLoading;

  const handleBetweenAccounts = useCallback(() => {
    onClose();
    initiateWithdrawal().catch((error: unknown) => {
      console.error(
        '[MoneyTransferSheet] Between-accounts initiation failed',
        error,
      );
    });
  }, [initiateWithdrawal, onClose]);

  const handlePerpsAccount = useCallback(() => {
    onClose();
    initiatePerpsDeposit().catch((error: unknown) => {
      console.error(
        '[MoneyTransferSheet] Perps deposit initiation failed',
        error,
      );
    });
  }, [initiatePerpsDeposit, onClose]);

  const options = useMemo((): MoneyTransferOption[] => {
    const rows: MoneyTransferOption[] = [
      {
        label: t('moneyTransferBetweenAccounts'),
        icon: IconName.Arrow2UpRight,
        onPress: handleBetweenAccounts,
        testId: MONEY_TRANSFER_SHEET_TEST_IDS.betweenAccounts,
        disabled: isBusy,
      },
    ];

    if (isPerpsEligible) {
      rows.push({
        label: t('moneyTransferPerpsAccount'),
        icon: IconName.Candlestick,
        onPress: handlePerpsAccount,
        testId: MONEY_TRANSFER_SHEET_TEST_IDS.perpsAccount,
        disabled: !isPerpsEnabled || isBusy,
      });
    }

    rows.push(
      {
        label: t('moneyTransferSendExternal'),
        icon: IconName.Arrow2Up,
        testId: MONEY_TRANSFER_SHEET_TEST_IDS.sendExternal,
        disabled: true,
        comingSoon: true,
      },
      {
        label: t('moneyTransferWithdrawToBank'),
        icon: IconName.Bank,
        testId: MONEY_TRANSFER_SHEET_TEST_IDS.withdrawToBank,
        disabled: true,
        comingSoon: true,
      },
    );

    return [
      ...rows.filter((option) => !option.disabled),
      ...rows.filter((option) => option.disabled),
    ];
  }, [
    handleBetweenAccounts,
    handlePerpsAccount,
    isBusy,
    isPerpsEligible,
    isPerpsEnabled,
    t,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      onClose={onClose}
      data-testid={MONEY_TRANSFER_SHEET_TEST_IDS.container}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Text variant={TextVariant.HeadingSm}>{t('moneyTransferTitle')}</Text>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col">
            {options.map((option) => (
              <button
                key={option.testId}
                type="button"
                data-testid={option.testId}
                disabled={option.disabled}
                onClick={option.disabled ? undefined : option.onPress}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left disabled:cursor-default"
              >
                <Icon
                  name={option.icon}
                  size={IconSize.Lg}
                  color={
                    option.disabled
                      ? IconColor.IconMuted
                      : IconColor.IconDefault
                  }
                />
                {option.comingSoon ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                      color={TextColor.TextAlternative}
                    >
                      {option.label}
                    </Text>
                    <Tag>{t('moneyTransferComingSoon')}</Tag>
                  </div>
                ) : (
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={
                      option.disabled
                        ? TextColor.TextAlternative
                        : TextColor.TextDefault
                    }
                  >
                    {option.label}
                  </Text>
                )}
              </button>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
