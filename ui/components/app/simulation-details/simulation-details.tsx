import React from 'react';
import { SimulationData } from '@metamask/transaction-controller';
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
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Preloader from '../../ui/icon/preloader/preloader-icon.component';
import { BalanceChangeList } from './balance-change-list';
import { useBalanceChanges } from './useBalanceChanges';

export type SimulationPreviewProps = {
  simulationData?: SimulationData;
};

/**
 * Displayed while loading the simulation preview.
 *
 * @returns
 */
const LoadingIndicator: React.FC = () => {
  return <Preloader size={20} />;
};

/**
 * Content when simulation has failed.
 */
const ErrorContent: React.FC = () => {
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
const EmptyContent: React.FC = () => {
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
 *
 * @param props
 * @param props.children
 */
const HeaderLayout: React.FC = ({ children }) => {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={1}
    >
      <Text variant={TextVariant.bodyMdMedium}>
        {t('simulationPreviewTitle')}
      </Text>
      <InfoTooltip
        position="right"
        iconFillColor="var(--color-icon-muted)"
        contentText={t('simulationPreviewTitleTooltip')}
      />
      {children}
    </Box>
  );
};

/**
 * Top-level layout for the simulation preview.
 *
 * @param props
 * @param props.inHeader
 * @param props.children
 */
const SimulationPreviewLayout: React.FC<{
  inHeader?: React.ReactNode;
}> = ({ inHeader, children }) => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
    borderRadius={BorderRadius.MD}
    borderColor={BorderColor.borderDefault}
    padding={3}
    margin={4}
    gap={5}
  >
    <HeaderLayout>{inHeader}</HeaderLayout>
    {children}
  </Box>
);

/**
 * Preview of a transaction's effects using simulation data.
 *
 * @param props
 * @param props.simulationData - The simulation data to display.
 */
export const SimulationDetails: React.FC<SimulationPreviewProps> = ({
  simulationData,
}: SimulationPreviewProps) => {
  const t = useI18nContext();
  const { pending: loading, value: balanceChanges } =
    useBalanceChanges(simulationData);

  if (loading) {
    return (
      <SimulationPreviewLayout
        inHeader={<LoadingIndicator />}
      ></SimulationPreviewLayout>
    );
  }

  const error = !simulationData;
  if (error) {
    return (
      <SimulationPreviewLayout>
        <ErrorContent />
      </SimulationPreviewLayout>
    );
  }

  const empty = balanceChanges.length === 0;
  if (empty) {
    return (
      <SimulationPreviewLayout>
        <EmptyContent />
      </SimulationPreviewLayout>
    );
  }

  const outgoing = balanceChanges.filter((change) => change.amount.isNegative);
  const incoming = balanceChanges.filter((change) => !change.amount.isNegative);
  return (
    <SimulationPreviewLayout>
      <BalanceChangeList
        heading={t('simulationPreviewOutgoingHeading')}
        balanceChanges={outgoing}
      />
      <BalanceChangeList
        heading={t('simulationPreviewIncomingHeading')}
        balanceChanges={incoming}
      />
    </SimulationPreviewLayout>
  );
};
