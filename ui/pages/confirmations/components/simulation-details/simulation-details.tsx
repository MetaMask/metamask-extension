import {
  SimulationError,
  SimulationErrorCode,
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAlertMetrics } from '../../../../components/app/alert-system/contexts/alertMetricsContext';
import InlineAlert from '../../../../components/app/alert-system/inline-alert';
import { MultipleAlertModal } from '../../../../components/app/alert-system/multiple-alert-modal';
import {
  ConfirmInfoAlertRow,
  getAlertTextColors,
} from '../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoSection } from '../../../../components/app/confirm/info/row/section';
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
import useAlerts from '../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectTransactionMetadata } from '../../../../selectors';
import { BalanceChangeList } from './balance-change-list';
import { BalanceChange } from './types';
import { useBalanceChanges } from './useBalanceChanges';
import { useSimulationMetrics } from './useSimulationMetrics';

export type StaticRow = {
  label: string;
  balanceChanges: BalanceChange[];
};

export type SimulationDetailsProps = {
  enableMetrics?: boolean;
  isTransactionsRedesign?: boolean;
  metricsOnly?: boolean;
  staticRows?: StaticRow[];
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

  const transactionMetadata = useSelector((state) =>
    selectTransactionMetadata(state, transactionId),
  );

  const isEnforced = transactionMetadata?.containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  const label = isEnforced
    ? t('simulationDetailsTitleEnforced')
    : t('simulationDetailsTitle');

  const tooltip = isEnforced
    ? t('simulationDetailsTitleTooltipEnforced')
    : t('simulationDetailsTitleTooltip');

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.Resimulation}
      label={label}
      ownerId={transactionId}
      tooltip={tooltip}
      tooltipIcon={isEnforced && IconName.SecurityTick}
      tooltipIconColor={isEnforced && IconColor.infoDefault}
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
}> = ({ inHeader, isTransactionsRedesign, transactionId, children }) =>
  isTransactionsRedesign ? (
    <ConfirmInfoSection noPadding>
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
    </ConfirmInfoSection>
  ) : (
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

const BalanceChangesAlert = ({ transactionId }: { transactionId: string }) => {
  const { getFieldAlerts } = useAlerts(transactionId);
  const fieldAlerts = getFieldAlerts(RowAlertKey.EstimatedChangesStatic);
  const selectedAlertSeverity = fieldAlerts[0]?.severity;
  const selectedAlertKey = fieldAlerts[0]?.key;

  const { trackInlineAlertClicked } = useAlertMetrics();

  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);

  const handleModalClose = () => {
    setAlertModalVisible(false);
  };

  const handleInlineAlertClick = () => {
    setAlertModalVisible(true);
    trackInlineAlertClicked(selectedAlertKey);
  };

  return (
    <>
      {fieldAlerts.length > 0 && (
        <Box marginLeft={1}>
          <InlineAlert
            onClick={handleInlineAlertClick}
            severity={selectedAlertSeverity}
          />
        </Box>
      )}
      {alertModalVisible && (
        <MultipleAlertModal
          alertKey={selectedAlertKey}
          ownerId={transactionId}
          onFinalAcknowledgeClick={handleModalClose}
          onClose={handleModalClose}
          showCloseIcon={false}
          skipAlertNavigation={true}
        />
      )}
    </>
  );
};

/**
 * Preview of a transaction's effects using simulation data.
 *
 * @param props
 * @param props.transaction - Metadata of the transaction that was simulated.
 * @param props.enableMetrics - Whether to enable simulation metrics.
 * @param props.isTransactionsRedesign - Whether or not the component is being
 * used inside the transaction redesign flow.
 * @param props.metricsOnly - Whether to only track metrics and not render the UI.
 * @param props.staticRows - Optional static rows to display.
 */
export const SimulationDetails: React.FC<SimulationDetailsProps> = ({
  transaction,
  enableMetrics = false,
  isTransactionsRedesign = false,
  metricsOnly = false,
  staticRows = [],
}: SimulationDetailsProps) => {
  const t = useI18nContext();
  const { chainId, id: transactionId, simulationData } = transaction;
  const balanceChangesResult = useBalanceChanges({ chainId, simulationData });
  const loading = !simulationData || balanceChangesResult.pending;

  const hasStaticData =
    staticRows?.length > 0 &&
    staticRows.some((row) => row.balanceChanges?.length > 0);

  useSimulationMetrics({
    enableMetrics,
    balanceChanges: balanceChangesResult.value,
    loading,
    simulationData,
    transactionId,
  });

  const { getFieldAlerts } = useAlerts(transactionId);
  const fieldAlerts = getFieldAlerts(RowAlertKey.EstimatedChangesStatic);
  const selectedAlertSeverity = fieldAlerts[0]?.severity;

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
    ].includes(error?.code as SimulationErrorCode) &&
    !hasStaticData
  ) {
    return null;
  }

  if (error && !hasStaticData) {
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
  const empty = balanceChanges.length === 0 && !hasStaticData;
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
        {staticRows.map((staticRow, index) => (
          <>
            <BalanceChangeList
              key={index}
              heading={staticRow.label}
              balanceChanges={staticRow.balanceChanges}
              labelColor={getAlertTextColors(selectedAlertSeverity)}
            />
            <BalanceChangesAlert transactionId={transactionId} />
          </>
        ))}
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
