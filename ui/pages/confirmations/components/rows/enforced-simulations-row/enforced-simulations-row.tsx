/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useState } from 'react';
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Checkbox,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import Tooltip from '../../../../../components/ui/tooltip';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { applyTransactionContainersExisting } from '../../../../../store/actions';
import { useIsEnforcedSimulationsEligible } from '../../../hooks/useIsEnforcedSimulationsEligible';
import { logConfirmationTransactionDebug } from '../../../utils/enforced-simulations-debug';

const ADDED_PROTECTION_LEARN_MORE_URL =
  'https://support.metamask.io/manage-crypto/transactions/simulations/';

export function EnforcedSimulationsRow() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const { containerTypes, id: transactionId } = currentConfirmation ?? {};

  const isEligible = useIsEnforcedSimulationsEligible();
  const [isUnavailable, setIsUnavailable] = useState(false);

  const hasAutoEnabled = containerTypes !== undefined;

  const hasEnforcedSimulations = containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  useEffect(() => {
    setIsUnavailable(false);
  }, [transactionId]);

  useEffect(() => {
    if (
      isUnavailable ||
      !isEligible ||
      hasAutoEnabled ||
      !transactionId
    ) {
      return;
    }

    logConfirmationTransactionDebug(
      'protection-auto-enable-request',
      currentConfirmation,
      {
        requestedContainerTypes: [
          ...(containerTypes ?? []),
          TransactionContainerType.EnforcedSimulations,
        ],
      },
    );

    applyTransactionContainersExisting(transactionId, [
      ...(containerTypes ?? []),
      TransactionContainerType.EnforcedSimulations,
    ]).catch((error) => {
      logConfirmationTransactionDebug(
        'protection-auto-enable-failed',
        currentConfirmation,
        { error: String(error) },
      );
      setIsUnavailable(true);
      if (!process.env.IN_TEST) {
        console.error(error);
      }
    });
  }, [
    currentConfirmation,
    isEligible,
    hasAutoEnabled,
    transactionId,
    containerTypes,
    isUnavailable,
  ]);

  if (isUnavailable || !hasAutoEnabled) {
    return null;
  }

  return (
    <Box
      data-testid="enforced-simulations-row"
      flexDirection={BoxFlexDirection.Column}
      padding={4}
      gap={2}
      marginBottom={4}
      className="relative overflow-visible rounded-lg border-2 border-muted shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] bg-[linear-gradient(180deg,var(--color-background-default)_0%,var(--color-background-alternative)_100%)]"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Start}
      >
        <TitleRow />

        <EnforcedSimulationsCheckbox
          isEnabled={Boolean(hasEnforcedSimulations)}
          containerTypes={containerTypes}
          transactionId={transactionId as string}
          onUnavailable={() => setIsUnavailable(true)}
        />
      </Box>

      <Description />
    </Box>
  );
}

function EnforcedSimulationsCheckbox({
  isEnabled,
  containerTypes,
  transactionId,
  onUnavailable,
}: {
  isEnabled: boolean;
  containerTypes?: TransactionContainerType[];
  transactionId: string;
  onUnavailable: () => void;
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

    logConfirmationTransactionDebug('protection-toggle-request', undefined, {
      transactionId,
      currentContainerTypes: containerTypes,
      requestedContainerTypes: newContainerTypes,
      targetEnabled,
    });

    try {
      await applyTransactionContainersExisting(
        transactionId,
        newContainerTypes,
      );
      logConfirmationTransactionDebug('protection-toggle-complete', undefined, {
        transactionId,
        currentContainerTypes: containerTypes,
        requestedContainerTypes: newContainerTypes,
        targetEnabled,
      });
    } catch (error) {
      logConfirmationTransactionDebug('protection-toggle-failed', undefined, {
        transactionId,
        currentContainerTypes: containerTypes,
        requestedContainerTypes: newContainerTypes,
        targetEnabled,
        error: String(error),
      });
      onUnavailable();
      setPendingEnabled(null);
    }
  }, [containerTypes, isEnabled, onUnavailable, transactionId]);

  if (isToggling) {
    return (
      <Icon
        name={IconName.Loading}
        size={IconSize.Md}
        color={IconColor.IconAlternative}
        className="animate-spin"
        data-testid="enforced-simulations-loading"
      />
    );
  }

  return (
    <Checkbox
      id="enforced-simulations-toggle"
      data-testid="enforced-simulations-toggle"
      isSelected={isEnabled}
      onChange={() => handleToggle()}
      inputProps={{ 'data-testid': 'enforced-simulations-toggle-input' }}
    />
  );
}

function TitleRow() {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      <Icon
        name={IconName.SecurityKey}
        size={IconSize.Sm}
        color={IconColor.IconDefault}
      />

      <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
        {t('addedProtectionTitle')}
      </Text>

      <Tooltip
        title={t('addedProtectionTooltip')}
        position="top"
        distance={8}
        tag="span"
        wrapperStyle={{ display: 'flex', alignItems: 'center' }}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Icon
          name={IconName.Question}
          size={IconSize.Sm}
          color={IconColor.IconMuted}
        />
      </Tooltip>

      <Box
        data-testid="enforced-simulations-optional-badge"
        backgroundColor={BoxBackgroundColor.InfoMuted}
        alignItems={BoxAlignItems.Center}
        paddingLeft={2}
        paddingRight={2}
        className="rounded py-px"
      >
        <Text
          variant={TextVariant.BodyXs}
          color={TextColor.InfoDefault}
          fontWeight={FontWeight.Medium}
        >
          {t('addedProtectionOptionalBadge')}
        </Text>
      </Box>
    </Box>
  );
}

function Description() {
  const t = useI18nContext();

  return (
    <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
      {t('addedProtectionDescription')}{' '}
      <a
        href={ADDED_PROTECTION_LEARN_MORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="enforced-simulations-learn-more"
        className="text-primary-default hover:underline"
      >
        {t('learnMore').charAt(0).toUpperCase() + t('learnMore').slice(1)}
      </a>
    </Text>
  );
}
