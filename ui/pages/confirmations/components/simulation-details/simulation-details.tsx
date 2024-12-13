import {
  SimulationError,
  SimulationErrorCode,
  TransactionMeta,
} from '@metamask/transaction-controller';
import React from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import Preloader from '../../../../components/ui/icon/preloader/preloader-icon.component';
import Tooltip from '../../../../components/ui/tooltip';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ConfirmInfoAlertRow } from '../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { BalanceChangeList } from './balance-change-list';
import { useBalanceChanges } from './useBalanceChanges';
import { useSimulationMetrics } from './useSimulationMetrics';

export type SimulationDetailsProps = {
  enableMetrics?: boolean;
  isTransactionsRedesign?: boolean;
  metricsOnly?: boolean;
  transaction: TransactionMeta;
};

/**
 * Displayed while loading the simulation preview.
 *
 * @returns
 */
const LoadingIndicator: React.FC = () => {
  return (
    <div role="progressbar">
      <Preloader size={20} />
    </div>
  );
};

/**
 * Content when simulation has failed.
 *
 * @param props
 * @param props.error
 */
const ErrorContent: React.FC<{ error: SimulationError }> = ({ error }) => {
  const t = useI18nContext();

  function getMessage() {
    return error.code === SimulationErrorCode.Reverted
      ? t('simulationDetailsTransactionReverted')
      : t('simulationDetailsUnavailable');
  }

  return (
    <Text
      color={
        error.code === SimulationErrorCode.Reverted
          ? TextColor.warningDefault
          : TextColor.textDefault
      }
      variant={TextVariant.bodyMd}
      display={Display.Flex}
      alignItems={AlignItems.center}
    >
      {error.code === SimulationErrorCode.Reverted && (
        <Icon name={IconName.Warning} marginInlineEnd={1} />
      )}
      {getMessage()}
    </Text>
  );
};

/**
 * Content when there are no balance changes.
 */
const EmptyContent: React.FC = () => {
  const t = useI18nContext();
  return (
    <Text color={TextColor.textDefault} variant={TextVariant.bodyMd}>
      {t('simulationDetailsNoChanges')}
    </Text>
  );
};

const HeaderWithAlert = ({ transactionId }: { transactionId: string }) => {
  const t = useI18nContext();

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.Resimulation}
      label={t('simulationDetailsTitle')}
      ownerId={transactionId}
      tooltip={t('simulationDetailsTitleTooltip')}
      style={{
        paddingLeft: 0,
        paddingRight: 0,
      }}
    />
  );
};

const LegacyHeader = () => {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={1}
    >
      <Text variant={TextVariant.bodyMdMedium}>
        {t('simulationDetailsTitle')}
      </Text>
      <Tooltip
        interactive
        position="top"
        containerClassName="info-tooltip__tooltip-container"
        tooltipInnerClassName="info-tooltip__tooltip-content"
        tooltipArrowClassName="info-tooltip__top-tooltip-arrow"
        html={t('simulationDetailsTitleTooltip')}
        theme="tippy-tooltip-info"
        style={{ display: Display.Flex }}
      >
        <Icon
          name={IconName.Question}
          marginLeft={1}
          color={IconColor.iconMuted}
          size={IconSize.Sm}
        />
      </Tooltip>
    </Box>
  );
};

/**
 * Header at the top of the simulation preview.
 *
 * @param props
 * @param props.children
 * @param props.isTransactionsRedesign
 * @param props.transactionId
 */
const HeaderLayout: React.FC<{
  isTransactionsRedesign: boolean;
  transactionId: string;
}> = ({ children, isTransactionsRedesign, transactionId }) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      {isTransactionsRedesign ? (
        <HeaderWithAlert transactionId={transactionId} />
      ) : (
        <LegacyHeader />
      )}
      {children}
    </Box>
  );
};

/**
 * Top-level layout for the simulation preview.
 *
 * @param props
 * @param props.inHeader
 * @param props.isTransactionsRedesign
 * @param props.children
 * @param props.transactionId
 */
const SimulationDetailsLayout: React.FC<{
  inHeader?: React.ReactNode;
  isTransactionsRedesign: boolean;
  transactionId: string;
}> = ({ inHeader, isTransactionsRedesign, transactionId, children }) => (
  <Box
    data-testid="simulation-details-layout"
    className="simulation-details-layout"
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
    borderRadius={BorderRadius.LG}
    borderColor={
      isTransactionsRedesign
        ? BorderColor.transparent
        : BorderColor.borderDefault
    }
    padding={3}
    margin={isTransactionsRedesign ? null : 4}
    gap={3}
  >
    <HeaderLayout
      isTransactionsRedesign={isTransactionsRedesign}
      transactionId={transactionId}
    >
      {inHeader}
    </HeaderLayout>
    {children}
  </Box>
);

/**
 * Preview of a transaction's effects using simulation data.
 *
 * @param props
 * @param props.transaction - Metadata of the transaction that was simulated.
 * @param props.enableMetrics - Whether to enable simulation metrics.
 * @param props.isTransactionsRedesign - Whether or not the component is being
 * used inside the transaction redesign flow.
 * @param props.metricsOnly - Whether to only track metrics and not render the UI.
 */
export const SimulationDetails: React.FC<SimulationDetailsProps> = ({
  transaction,
  enableMetrics = false,
  isTransactionsRedesign = false,
  metricsOnly = false,
}: SimulationDetailsProps) => {
  const t = useI18nContext();
  const { chainId, id: transactionId, simulationData } = transaction;
  const balanceChangesResult = useBalanceChanges({ chainId, simulationData });
  const loading = !simulationData || balanceChangesResult.pending;

  useSimulationMetrics({
    enableMetrics,
    balanceChanges: balanceChangesResult.value,
    loading,
    simulationData,
    transactionId,
  });

  if (metricsOnly) {
    return null;
  }

  if (loading) {
    return (
      <SimulationDetailsLayout
        inHeader={<LoadingIndicator />}
        isTransactionsRedesign={isTransactionsRedesign}
        transactionId={transactionId}
      ></SimulationDetailsLayout>
    );
  }

  const { error } = simulationData;

  if (
    [
      SimulationErrorCode.ChainNotSupported,
      SimulationErrorCode.Disabled,
    ].includes(error?.code as SimulationErrorCode)
  ) {
    return null;
  }

  if (error) {
    const inHeaderProp = error.code !== SimulationErrorCode.Reverted && {
      inHeader: <ErrorContent error={error} />,
    };

    return (
      <SimulationDetailsLayout
        isTransactionsRedesign={isTransactionsRedesign}
        transactionId={transactionId}
        {...inHeaderProp}
      >
        {error.code === SimulationErrorCode.Reverted && (
          <ErrorContent error={error} />
        )}
      </SimulationDetailsLayout>
    );
  }

  const balanceChanges = balanceChangesResult.value;
  const empty = balanceChanges.length === 0;
  if (empty) {
    return (
      <SimulationDetailsLayout
        isTransactionsRedesign={isTransactionsRedesign}
        transactionId={transactionId}
        inHeader={<EmptyContent />}
      />
    );
  }

  const outgoing = balanceChanges.filter((bc) => bc.amount.isNegative());
  const incoming = balanceChanges.filter((bc) => !bc.amount.isNegative());
  return (
    <SimulationDetailsLayout
      isTransactionsRedesign={isTransactionsRedesign}
      transactionId={transactionId}
    >
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={3}>
        <BalanceChangeList
          heading={t('simulationDetailsOutgoingHeading')}
          balanceChanges={outgoing}
          testId="simulation-rows-outgoing"
        />
        <BalanceChangeList
          heading={t('simulationDetailsIncomingHeading')}
          balanceChanges={incoming}
          testId="simulation-rows-incoming"
        />
      </Box>
    </SimulationDetailsLayout>
  );
};
