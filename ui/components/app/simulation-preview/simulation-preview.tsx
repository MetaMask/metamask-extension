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

export interface SimulationPreviewProps {
  simulationData?: SimulationData;
}

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
