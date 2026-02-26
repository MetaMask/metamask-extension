import {
  SimulationError,
  SimulationErrorCode,
  TransactionContainerType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import React, { Fragment, useState } from 'react';
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
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import { Skeleton } from '../../../../components/component-library/skeleton';
import Tooltip from '../../../../components/ui/tooltip';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import useAlerts from '../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectTransactionMetadata } from '../../../../selectors';
import { SimulationSettingsModal } from '../modals/simulation-settings-modal/simulation-settings-modal';
import { selectConfirmationAdvancedDetailsOpen } from '../../selectors/preferences';
import { useIsEnforcedSimulationsSupported } from '../../hooks/transactions/useIsEnforcedSimulationsSupported';
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
  smartTransactionStatus?: string;
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
    <Text
      color={TextColor.textDefault}
      variant={TextVariant.bodyMd}
      width={BlockSize.ElevenTwelfths}
      textAlign={TextAlign.Right}
    >
      {t('simulationDetailsNoChanges')}
    </Text>
  );
};

const HeaderWithAlert = ({
  title,
  titleTooltip,
  transactionId,
}: {
  title?: string;
  titleTooltip?: string;
  transactionId: string;
}) => {
  const t = useI18nContext();
  const isEnforcedSimulationsSupported = useIsEnforcedSimulationsSupported();

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const transactionMetadata = useSelector((state) =>
    selectTransactionMetadata(state, transactionId),
  );

  const isEnforced = transactionMetadata?.containerTypes?.includes(
    TransactionContainerType.EnforcedSimulations,
  );

  const label =
    title ??
    (isEnforced
      ? t('simulationDetailsTitleEnforced')
      : t('simulationDetailsTitle'));

  const tooltip =
    titleTooltip ??
    (isEnforced
      ? t('simulationDetailsTitleTooltipEnforced')
      : t('simulationDetailsTitleTooltip'));

  const [settingsModalVisible, setSettingsModalVisible] =
    useState<boolean>(false);

  const showSettingsIcon =
    showAdvancedDetails && isEnforcedSimulationsSupported;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      alignItems={AlignItems.center}
    >
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
      {showSettingsIcon && (
        <ButtonIcon
          iconName={IconName.Setting}
          size={ButtonIconSize.Sm}
          color={IconColor.iconMuted}
          ariaLabel="simulation-settings"
          onClick={() => setSettingsModalVisible(true)}
        />
      )}
      {settingsModalVisible && (
        <SimulationSettingsModal
          onClose={() => setSettingsModalVisible(false)}
        />
      )}
    </Box>
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
          color={IconColor.iconAlternative}
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
 * @param props.title
 * @param props.titleTooltip
 */
const HeaderLayout: React.FC<{
  isTransactionsRedesign: boolean;
  transactionId: string;
  title?: string;
  titleTooltip?: string;
}> = ({
  children,
  isTransactionsRedesign,
  transactionId,
  title,
  titleTooltip,
}) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      {isTransactionsRedesign ? (
        <HeaderWithAlert
          title={title}
          titleTooltip={titleTooltip}
          transactionId={transactionId}
        />
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
 * @param props.title
 * @param props.titleTooltip
 * @param props.inHeader
 * @param props.isTransactionsRedesign
 * @param props.children
 * @param props.transactionId
 */
export const SimulationDetailsLayout: React.FC<{
  title?: string;
  titleTooltip?: string;
  inHeader?: React.ReactNode;
  isTransactionsRedesign: boolean;
  transactionId: string;
}> = ({
  title,
  titleTooltip,
  inHeader,
  isTransactionsRedesign,
  transactionId,
  children,
}) =>
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
        paddingInline={3}
        paddingTop={1}
        paddingBottom={2}
        margin={isTransactionsRedesign ? null : 4}
        gap={3}
      >
        <HeaderLayout
          isTransactionsRedesign={isTransactionsRedesign}
          transactionId={transactionId}
          title={title}
          titleTooltip={titleTooltip}
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
      paddingInline={3}
      paddingTop={2}
      paddingBottom={2}
      margin={isTransactionsRedesign ? null : 4}
      gap={3}
    >
      <HeaderLayout
        isTransactionsRedesign={isTransactionsRedesign}
        transactionId={transactionId}
        titleTooltip={titleTooltip}
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
            showArrow={false}
            textOverride={''}
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function SimulationDetailsSkeleton({
  isTransactionsRedesign,
  transactionId,
}: {
  isTransactionsRedesign: boolean;
  transactionId: string;
}) {
  return (
    <SimulationDetailsLayout
      isTransactionsRedesign={isTransactionsRedesign}
      transactionId={transactionId}
    >
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={3}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
        >
          <Skeleton height={20} width={72} />
          <Skeleton height={20} width={100} />
        </Box>
        <Box display={Display.Flex} justifyContent={JustifyContent.flexEnd}>
          <Skeleton height={18} width={40} />
        </Box>
      </Box>
    </SimulationDetailsLayout>
  );
}

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
 * @param props.smartTransactionStatus - Optional Smart Transaction status to override transaction status for immediate UI updates.
 */
export const SimulationDetails: React.FC<SimulationDetailsProps> = ({
  transaction,
  enableMetrics = false,
  isTransactionsRedesign = false,
  metricsOnly = false,
  staticRows = [],
  smartTransactionStatus,
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
      <SimulationDetailsSkeleton
        isTransactionsRedesign={isTransactionsRedesign}
        transactionId={transactionId}
      />
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

  // Determine the appropriate heading text based on transaction status
  const getHeadingText = (translationKeys: {
    default: string;
    inProgress: string;
    completed: string;
  }) => {
    const { status } = transaction;

    // If we have Smart Transaction status, use it as priority
    // This fixes the delay issue between Smart Transaction and regular transaction status updates
    if (smartTransactionStatus === 'success') {
      return t(translationKeys.completed);
    } else if (smartTransactionStatus === 'pending') {
      return t(translationKeys.inProgress);
    }

    // Fallback to regular transaction status
    if (status === TransactionStatus.confirmed) {
      return t(translationKeys.completed);
    } else if (
      status === TransactionStatus.submitted ||
      status === TransactionStatus.signed ||
      status === TransactionStatus.approved
    ) {
      return t(translationKeys.inProgress);
    }
    // Default for confirmation flows and other statuses (unapproved, failed, etc.)
    return t(translationKeys.default);
  };

  const getOutgoingHeadingText = () =>
    getHeadingText({
      default: 'simulationDetailsOutgoingHeading',
      inProgress: 'simulationDetailsOutgoingHeadingSending',
      completed: 'simulationDetailsOutgoingHeadingSent',
    });

  const getIncomingHeadingText = () =>
    getHeadingText({
      default: 'simulationDetailsIncomingHeading',
      inProgress: 'simulationDetailsIncomingHeadingReceiving',
      completed: 'simulationDetailsIncomingHeadingReceived',
    });

  return (
    <SimulationDetailsLayout
      isTransactionsRedesign={isTransactionsRedesign}
      transactionId={transactionId}
    >
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={3}>
        {staticRows.map((staticRow, index) => (
          <Fragment key={index}>
            <BalanceChangeList
              heading={staticRow.label}
              balanceChanges={staticRow.balanceChanges}
              labelColor={getAlertTextColors(selectedAlertSeverity)}
            />
            <BalanceChangesAlert transactionId={transactionId} />
          </Fragment>
        ))}
        <BalanceChangeList
          heading={getOutgoingHeadingText()}
          balanceChanges={outgoing}
          testId="simulation-rows-outgoing"
        />
        <BalanceChangeList
          heading={getIncomingHeadingText()}
          balanceChanges={incoming}
          testId="simulation-rows-incoming"
        />
      </Box>
    </SimulationDetailsLayout>
  );
};
