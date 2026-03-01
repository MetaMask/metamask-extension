/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  Box,
  Checkbox,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { isEnforcedSimulationsEligible } from '../../../../../../shared/lib/transaction/enforced-simulations';
import { applyTransactionContainersExisting } from '../../../../../store/actions';
import { useFeeCalculations } from '../../confirm/info/hooks/useFeeCalculations';

const ADDED_PROTECTION_LEARN_MORE_URL =
  'https://support.metamask.io/privacy-and-security/staying-safe-in-web3/what-are-enforced-simulations/';

export function EnforcedSimulationsRow() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isSupported = isEnforcedSimulationsEligible(currentConfirmation);

  const { containerDiffFiat } = useFeeCalculations(
    currentConfirmation as TransactionMeta,
  );

  // Cache the last computed fee delta so it remains visible when disabled.
  // Updated whenever a fresh non-empty value arrives (i.e. when enabled).
  const cachedDiffFiat = useRef(containerDiffFiat);

  if (containerDiffFiat) {
    cachedDiffFiat.current = containerDiffFiat;
  }

  const { containerTypes, id: transactionId } = currentConfirmation ?? {};

  const isEnabled = containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  if (!isSupported) {
    return null;
  }

  return (
    <Box
      data-testid="enforced-simulations-row"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      padding={4}
      gap={2}
      marginBottom={4}
      className="relative overflow-visible rounded-lg border-2 border-muted shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] bg-[linear-gradient(180deg,#fcfcfc_0%,#f3f5f9_100%)]"
    >
      <OptionalBadge />

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.flexStart}
      >
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textAlternative}
          >
            {t('addedProtectionTitle')}
          </Text>
          <Icon
            name={IconName.Info}
            size={IconSize.Sm}
            color={IconColor.iconMuted}
          />
        </Box>

        <EnforcedSimulationsCheckbox
          isEnabled={Boolean(isEnabled)}
          containerTypes={containerTypes}
          transactionId={transactionId as string}
        />
      </Box>

      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
        {cachedDiffFiat.current
          ? t('addedProtectionFeeDescription', [cachedDiffFiat.current])
          : t('addedProtectionDescription')}{' '}
        <Text
          as="a"
          display={Display.Inline}
          variant={TextVariant.inherit}
          color={TextColor.primaryDefault}
          href={ADDED_PROTECTION_LEARN_MORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          data-testid="enforced-simulations-learn-more"
        >
          {t('learnMore').charAt(0).toUpperCase() + t('learnMore').slice(1)}
        </Text>
      </Text>
    </Box>
  );
}

function EnforcedSimulationsCheckbox({
  isEnabled,
  containerTypes,
  transactionId,
}: {
  isEnabled: boolean;
  containerTypes?: TransactionContainerType[];
  transactionId: string;
}) {
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);

  const isToggling = pendingEnabled !== null;

  useEffect(() => {
    if (pendingEnabled === null) {
      return;
    }

    if (isEnabled === pendingEnabled) {
      setPendingEnabled(null);
    }
  }, [isEnabled, pendingEnabled]);

  const handleToggle = useCallback(async () => {
    const targetEnabled = !isEnabled;
    setPendingEnabled(targetEnabled);

    const newContainerTypes = [...(containerTypes ?? [])];

    if (isEnabled) {
      const index = newContainerTypes.indexOf(
        TransactionContainerType.EnforcedSimulations,
      );

      if (index !== -1) {
        newContainerTypes.splice(index, 1);
      }
    } else {
      newContainerTypes.push(TransactionContainerType.EnforcedSimulations);
    }

    await applyTransactionContainersExisting(transactionId, newContainerTypes);
  }, [containerTypes, isEnabled, transactionId]);

  if (isToggling) {
    return (
      <Icon
        name={IconName.Loading}
        size={IconSize.Md}
        color={IconColor.iconAlternative}
        className="animate-spin"
        data-testid="enforced-simulations-loading"
      />
    );
  }

  return (
    <Checkbox
      data-testid="enforced-simulations-toggle"
      isChecked={isEnabled}
      onChange={handleToggle}
    />
  );
}

function OptionalBadge() {
  const t = useI18nContext();

  return (
    <Box
      data-testid="enforced-simulations-optional-badge"
      display={Display.Flex}
      alignItems={AlignItems.center}
      gap={1}
      className="absolute -top-2.5 left-3 rounded-full bg-[linear-gradient(90deg,#7685f5_0%,#95b3ff_100%)] px-2 py-0.5 h-5"
    >
      <Icon
        name={IconName.SecurityTick}
        size={IconSize.Xs}
        color={IconColor.primaryInverse}
      />
      <Text
        variant={TextVariant.bodyXs}
        color={TextColor.primaryInverse}
        className="font-bold uppercase tracking-wider"
      >
        {t('addedProtectionOptionalBadge')}
      </Text>
    </Box>
  );
}
