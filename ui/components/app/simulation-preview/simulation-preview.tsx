import React from 'react';
import {
  SimulationBalanceChange,
  SimulationData,
} from '@metamask/transaction-controller';
import { Numeric } from '../../../../shared/modules/Numeric';
import { Box, Icon, IconName, Text } from '../../component-library';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { EtherDenomination } from '../../../../shared/constants/common';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BalanceChange } from './types';
import { BalanceChangeList } from './balance-change-list';

export type SimulationPreviewProps = {
  simulationData?: SimulationData;
};

/**
 * Converts a SimulationBalanceChange to a BalanceChange for the native asset.
 *
 * @param balanceChange
 * @param balanceChange.isDecrease
 * @param balanceChange.difference
 * @returns The converted BalanceChange object.
 */
function getNativeAssetBalanceChange({
  isDecrease,
  difference,
}: SimulationBalanceChange): BalanceChange {
  return {
    assetInfo: { isNative: true },
    isDecrease,
    absChange: new Numeric(difference, 16, EtherDenomination.WEI),
  };
}

/**
 * Retrieves the asset balance changes from the simulation data.
 *
 * @param simulationData - The simulation data.
 * @returns An array of BalanceChange objects.
 */
function getAssetBalanceChanges(simulationData: SimulationData) {
  if (!simulationData) {
    return [];
  }
  const { nativeBalanceChange } = simulationData;
  const balanceChanges = [];

  if (nativeBalanceChange) {
    balanceChanges.push(getNativeAssetBalanceChange(nativeBalanceChange));
  }
  return balanceChanges;
}

/**
 * Content when simulation has failed.
 */
const SimulationFailedContent: React.FC = () => {
  const t = useI18nContext();
  return (
    <Text
      color={TextColor.warningDefault}
      variant={TextVariant.bodySm}
      display={Display.Flex}
      alignItems={AlignItems.flexStart}
    >
      <Icon name={IconName.Warning} marginInlineEnd={1} />
      {t('simulationPreviewFailed')}
    </Text>
  );
};

/**
 * Content when there are no balance changes.
 */
const NoBalanceChangesContent: React.FC = () => {
  const t = useI18nContext();
  return (
    <Text
      color={TextColor.textAlternative}
      variant={TextVariant.bodySm}
      display={Display.Flex}
      alignItems={AlignItems.flexStart}
    >
      {t('simulationPreviewNoBalanceChanges')}
    </Text>
  );
};

/**
 * Header at the top of the simulation preview.
 */
const SimulationPreviewHeader: React.FC = () => {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={1}
      marginBottom={3}
    >
      <Text variant={TextVariant.bodyMdMedium}>
        {t('simulationPreviewTitle')}
      </Text>
      <InfoTooltip
        position="right"
        iconFillColor="var(--color-icon-muted)"
        contentText={t('simulationPreviewTitleTooltip')}
      />
    </Box>
  );
};

/**
 * Layout component for the simulation preview.
 *
 * @param options0
 * @param options0.children
 */
const SimulationPreviewLayout: React.FC = ({ children }) => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
    borderRadius={BorderRadius.MD}
    borderColor={BorderColor.borderDefault}
    padding={3}
    margin={4}
  >
    {children}
  </Box>
);

/**
 * Preview of a transaction's effects using simulation data.
 *
 * @param props
 * @param props.simulationData - The simulation data to display.
 */
export const SimulationPreview: React.FC<SimulationPreviewProps> = ({
  simulationData,
}: SimulationPreviewProps) => {
  const t = useI18nContext();

  const simulationFailed = !simulationData;
  if (simulationFailed) {
    return (
      <SimulationPreviewLayout>
        <SimulationPreviewHeader />
        <SimulationFailedContent />
      </SimulationPreviewLayout>
    );
  }

  const balanceChanges = getAssetBalanceChanges(simulationData);
  if (balanceChanges.length === 0) {
    return (
      <SimulationPreviewLayout>
        <SimulationPreviewHeader />
        <NoBalanceChangesContent />
      </SimulationPreviewLayout>
    );
  }

  const outgoing = balanceChanges.filter((change) => change.isDecrease);
  const incoming = balanceChanges.filter((change) => !change.isDecrease);
  return (
    <SimulationPreviewLayout>
      <SimulationPreviewHeader />
      <BalanceChangeList
        balanceChanges={outgoing}
        heading={t('simulationPreviewOutgoingHeading')}
      />
      <BalanceChangeList
        balanceChanges={incoming}
        heading={t('simulationPreviewIncomingHeading')}
      />
    </SimulationPreviewLayout>
  );
};
