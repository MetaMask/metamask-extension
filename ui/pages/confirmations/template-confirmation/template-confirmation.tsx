import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { ApprovalRequest } from '@metamask/approval-controller';
import { Json } from '@metamask/eth-query';
import { useDispatch, useSelector } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';
import { useHistory, useParams } from 'react-router-dom';
import { Hex } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';
import { isEqual } from 'lodash';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import ConfirmationWarningModal from '../components/confirmation-warning-modal';
import { SnapUIRenderer } from '../../../components/app/snaps/snap-ui-renderer';
import SnapAuthorshipHeader from '../../../components/app/snaps/snap-authorship-header';
import {
  getApprovalFlows,
  getHideSnapBranding,
  getMemoizedUnapprovedTemplatedConfirmations,
  getSnapsMetadata,
  getUnapprovedTxCount,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, Icon, IconName } from '../../../components/component-library';
import MetamaskTemplateRenderer from '../../../components/app/metamask-template-renderer';
import {
  BackgroundColor,
  BlockSize,
  Severity,
} from '../../../helpers/constants/design-system';
import Callout from '../../../components/ui/callout';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import LoadingScreen from '../../../components/ui/loading-screen';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  SafeChainValidationResult,
  useSafeChainValidation,
} from './useSafeChainValidation';
import ConfirmationFooter from './components/confirmation-footer';
import { getTemplateAlerts, getTemplateValues } from './templates';

export type TemplateConfirmationProps = {
  redirectToHomeOnZeroConfirmations?: boolean;
};

export type TemplateValues = {
  content: unknown;
  hideSubmitButton: boolean;
  submitText: string;
  cancelText: string;
  loadingText: string;
  onCancel: () => void;
  onLoad?: () => void;
  onSubmit: (inputValue?: string | null) => Alert[];
  showWarningModal?: boolean;
};

type WalletState = {
  chainValidation: SafeChainValidationResult;
  networkConfiguration: NetworkConfiguration;
  unapprovedTxsCount: number;
};

type Alert = {
  id: string;
  content: unknown;
  severity: Severity;
};

const NAVIGATION_CONTROLS_HEIGHT = 32;
const SNAP_DIALOG_HEADER_HEIGHT = 64;
const INPUT_STATE_CONFIRMATIONS = [ApprovalType.SnapDialogPrompt];

function useAlerts({
  pendingConfirmation,
  walletState,
}: {
  pendingConfirmation: ApprovalRequest<Record<string, Json>>;
  walletState: WalletState;
}) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const allTemplateAlerts = useAsyncResult<Alert[]>(
    () => getTemplateAlerts(pendingConfirmation, walletState),
    [pendingConfirmation, walletState],
  );

  const dismissAlert = useCallback(
    (alertId) => {
      const key = `${pendingConfirmation.id}#${alertId}`;

      setDismissedAlerts((current) => [...current, key]);
    },
    [pendingConfirmation],
  );

  const alerts =
    allTemplateAlerts.value?.filter(
      (alert) =>
        !dismissedAlerts.includes(`${pendingConfirmation.id}#${alert.id}`),
    ) ?? [];

  return { alerts, dismissAlert };
}

function useWalletState({
  pendingConfirmation,
}: {
  pendingConfirmation?: ApprovalRequest<Record<string, Json>>;
}): WalletState {
  const chainValidation = useSafeChainValidation({
    chainId: pendingConfirmation?.requestData?.chainId as Hex,
    ticker: pendingConfirmation?.requestData?.ticker as string,
    enabled: pendingConfirmation?.type === ApprovalType.AddEthereumChain,
  });

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const networkConfiguration =
    networkConfigurationsByChainId?.[
      pendingConfirmation?.requestData?.chainId as Hex
    ];

  const unapprovedTxsCount = useSelector(getUnapprovedTxCount);

  return useMemo(
    () => ({ chainValidation, networkConfiguration, unapprovedTxsCount }),
    [chainValidation, networkConfiguration, unapprovedTxsCount],
  );
}

function useSnapConfirmation({
  pendingConfirmation,
}: {
  pendingConfirmation?: ApprovalRequest<Record<string, Json>>;
}) {
  const snapsMetadata = useSelector(getSnapsMetadata);

  const hideSnapBranding = useSelector((state) =>
    getHideSnapBranding(state, pendingConfirmation?.origin),
  );

  const name = snapsMetadata[pendingConfirmation?.origin as string]?.name;

  const snapDialogTypes = Object.values(DIALOG_APPROVAL_TYPES);
  const snapCustomUiDialogTypes = Object.values(DIALOG_APPROVAL_TYPES);

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  snapDialogTypes.push(
    ...Object.values(SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES),
  );
  ///: END:ONLY_INCLUDE_IF

  const isSnapDialog = snapDialogTypes.includes(
    pendingConfirmation?.type as string,
  );

  const isSnapCustomUIDialog = snapCustomUiDialogTypes.includes(
    pendingConfirmation?.type as string,
  );
  const isSnapPrompt =
    pendingConfirmation?.type === ApprovalType.SnapDialogPrompt;

  const isSnapDefaultDialog =
    pendingConfirmation?.type === DIALOG_APPROVAL_TYPES.default;

  const isSnapAlert =
    pendingConfirmation?.type === ApprovalType.SnapDialogAlert;

  const snapName = isSnapDialog && name;

  return {
    hideSnapBranding,
    isSnapAlert,
    isSnapDialog,
    isSnapCustomUIDialog,
    isSnapDefaultDialog,
    isSnapPrompt,
    snapName,
  };
}

function useMetrics({
  pendingConfirmation,
}: {
  pendingConfirmation: ApprovalRequest<Record<string, Json>>;
}) {
  const trackEvent = useContext(MetaMetricsContext);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestData = pendingConfirmation?.requestData as Record<string, any>;

  const trackSubmitEvents = useCallback(() => {
    const fromChainId = requestData?.fromNetworkConfiguration?.chainId;
    const toChainId = requestData?.toNetworkConfiguration?.chainId;

    if (fromChainId && toChainId) {
      trackEvent({
        category: MetaMetricsEventCategory.Network,
        event: MetaMetricsEventName.NavNetworkSwitched,
        properties: {
          location: 'Switch Modal',
          from_network: fromChainId,
          to_network: toChainId,
          referrer: {
            url: window.location.origin,
          },
        },
      });
    }
  }, [requestData]);

  return { trackSubmitEvents };
}

function Alerts({
  alerts,
  onDismiss,
}: {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
}) {
  return (
    <>
      {alerts.map((alert, index) => (
        <Callout
          key={alert.id}
          severity={alert.severity}
          dismiss={onDismiss ? () => onDismiss(alert.id) : undefined}
          isFirst={index === 0}
          isLast={index === alerts.length - 1}
          isMultiple={alerts.length > 1}
        >
          <MetamaskTemplateRenderer sections={alert.content} />
        </Callout>
      ))}
    </>
  );
}

function Nav({
  pendingConfirmationIndex,
  pendingConfirmations,
  onNavigateClick,
}: {
  pendingConfirmationIndex: number;
  pendingConfirmations: ApprovalRequest<Record<string, Json>>[];
  onNavigateClick: (index: number) => void;
}) {
  const t = useI18nContext();

  if (pendingConfirmations.length <= 1) {
    return null;
  }

  return (
    <Box
      className="confirmation-page__navigation"
      style={{ position: 'fixed', zIndex: 1 }}
      width={BlockSize.Screen}
    >
      <p>
        {t('xOfYPending', [
          pendingConfirmationIndex + 1,
          pendingConfirmations.length,
        ])}
      </p>
      {pendingConfirmationIndex > 0 && (
        <button
          className="confirmation-page__navigation-button"
          onClick={() => onNavigateClick(pendingConfirmationIndex - 1)}
        >
          <Icon name={IconName.ArrowLeft} />
        </button>
      )}
      <button
        className="confirmation-page__navigation-button"
        disabled={pendingConfirmationIndex + 1 === pendingConfirmations.length}
        onClick={() => onNavigateClick(pendingConfirmationIndex + 1)}
      >
        <Icon name={IconName.ArrowRight} />
      </button>
    </Box>
  );
}

function Header({
  pendingConfirmation,
  pendingConfirmations,
  onSnapCancel,
}: {
  pendingConfirmation: ApprovalRequest<Record<string, Json>>;
  pendingConfirmations: ApprovalRequest<Record<string, Json>>[];
  onSnapCancel: () => void;
}) {
  const { isSnapCustomUIDialog } = useSnapConfirmation({ pendingConfirmation });

  const hideSnapBranding = useSelector((state) =>
    getHideSnapBranding(state, pendingConfirmation?.origin),
  );

  if (!isSnapCustomUIDialog || hideSnapBranding) {
    return null;
  }

  return (
    <Box
      width={BlockSize.Screen}
      style={{
        position: 'fixed',
        zIndex: 1,
        marginTop: pendingConfirmations.length > 1 ? '32px' : 'initial',
      }}
    >
      <SnapAuthorshipHeader
        snapId={pendingConfirmation?.origin}
        onCancel={onSnapCancel}
      />
    </Box>
  );
}

function Footer({
  pendingConfirmation,
  isLoading,
  loadingText,
  submitAlerts,
  templateValues,
  walletState,
  onSubmit,
}: {
  pendingConfirmation: ApprovalRequest<Record<string, Json>>;
  isLoading: boolean;
  loadingText: string | undefined;
  submitAlerts: Alert[];
  templateValues: TemplateValues;
  walletState: WalletState;
  onSubmit?: () => void;
}) {
  const { alerts, dismissAlert } = useAlerts({
    pendingConfirmation,
    walletState,
  });

  const { isSnapDialog, isSnapDefaultDialog } = useSnapConfirmation({
    pendingConfirmation,
  });

  const {
    cancelText,
    hideSubmitButton,
    loadingText: templateLoadingText,
    onCancel,
    submitText,
  } = templateValues;

  const finalOnSubmit = !hideSubmitButton && onSubmit ? onSubmit : undefined;

  if (isSnapDefaultDialog) {
    return null;
  }

  return (
    <ConfirmationFooter
      alerts={<Alerts alerts={alerts} onDismiss={dismissAlert} />}
      style={
        isSnapDialog
          ? {
              boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
            }
          : {}
      }
      actionsStyle={
        isSnapDialog
          ? {
              borderTop: 0,
            }
          : {}
      }
      onSubmit={finalOnSubmit}
      onCancel={onCancel}
      submitText={submitText}
      cancelText={cancelText}
      loadingText={loadingText ?? templateLoadingText}
      loading={isLoading}
      submitAlerts={<Alerts alerts={submitAlerts} />}
    />
  );
}

function WarningModal({
  templatedValues,
  onSubmitResult,
}: {
  templatedValues: TemplateValues;
  onSubmitResult: (result: Alert[]) => void;
}) {
  const { onCancel, onSubmit: templateOnSubmit } = templatedValues;

  const handleSubmit = useCallback(async () => {
    const result = await templateOnSubmit();
    await onSubmitResult(result);
  }, [templatedValues]);

  return (
    <ConfirmationWarningModal onSubmit={handleSubmit} onCancel={onCancel} />
  );
}

function Content({
  pendingConfirmation,
  pendingConfirmations,
  templateValues,
  showWarningModal,
  inputValue,
  onInputChange,
  onSnapCancel,
  onSubmitResult,
}: {
  pendingConfirmation: ApprovalRequest<Record<string, Json>>;
  pendingConfirmations: ApprovalRequest<Record<string, Json>>[];
  templateValues: TemplateValues;
  showWarningModal: boolean;
  inputValue: string | null | undefined;
  onInputChange: (value: unknown) => void;
  onSnapCancel: () => void;
  onSubmitResult: (result: unknown) => void;
}) {
  const {
    hideSnapBranding,
    isSnapCustomUIDialog,
    isSnapDefaultDialog,
    isSnapPrompt,
  } = useSnapConfirmation({ pendingConfirmation });

  let contentMargin = 0;

  if (pendingConfirmations.length > 1) {
    contentMargin += NAVIGATION_CONTROLS_HEIGHT;
  }

  if (isSnapCustomUIDialog && !hideSnapBranding) {
    contentMargin += SNAP_DIALOG_HEADER_HEIGHT;
  }

  const { content } = templateValues;

  return (
    <Box
      className="confirmation-page__content"
      padding={isSnapCustomUIDialog ? 0 : 4}
      style={{
        marginTop: `${contentMargin}px`,
        overflowY: 'auto',
      }}
    >
      {isSnapCustomUIDialog ? (
        <SnapUIRenderer
          snapId={pendingConfirmation?.origin}
          interfaceId={pendingConfirmation?.requestData.id as string}
          isPrompt={isSnapPrompt}
          inputValue={inputValue}
          onInputChange={
            isSnapPrompt
              ? (event) => onInputChange(event.target.value)
              : undefined
          }
          placeholder={
            isSnapPrompt
              ? (pendingConfirmation?.requestData.placeholder as string)
              : undefined
          }
          useDelineator={false}
          onCancel={onSnapCancel}
          useFooter={isSnapDefaultDialog}
          contentBackgroundColor={BackgroundColor.backgroundAlternative}
        />
      ) : (
        <MetamaskTemplateRenderer sections={content} />
      )}

      {showWarningModal && (
        <WarningModal
          templatedValues={templateValues}
          onSubmitResult={onSubmitResult}
        />
      )}
    </Box>
  );
}

export function TemplateConfirmation({
  redirectToHomeOnZeroConfirmations,
}: TemplateConfirmationProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState<string | undefined>();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [submitAlerts, setSubmitAlerts] = useState<Alert[]>([]);
  const approvalFlows = useSelector(getApprovalFlows, isEqual);

  const [inputStates, setInputStates] = useState<
    Record<string, string | null | undefined>
  >({});

  const pendingConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );

  const pendingRoutedConfirmation = pendingConfirmations.findIndex(
    (confirmation) => confirmation.id === id,
  );

  const isRoutedConfirmation = id && pendingRoutedConfirmation !== -1;

  const [pendingConfirmationIndex, setPendingConfirmationIndex] = useState(
    // Confirmations that are directly routed to get priority and will be initially shown above the current queue.
    isRoutedConfirmation ? pendingRoutedConfirmation : 0,
  );

  const pendingConfirmation = pendingConfirmations[pendingConfirmationIndex];
  const walletState = useWalletState({ pendingConfirmation });
  const { trackSubmitEvents } = useMetrics({ pendingConfirmation });

  const { snapName, isSnapDialog, isSnapAlert } = useSnapConfirmation({
    pendingConfirmation,
  });

  const templatedValues = useMemo(() => {
    return pendingConfirmation
      ? getTemplateValues(
          {
            snapName: isSnapDialog && snapName,
            ...pendingConfirmation,
          },
          t,
          dispatch,
          history,
          walletState,
          { t, trackEvent },
        )
      : {};
  }, [
    pendingConfirmation,
    t,
    dispatch,
    history,
    trackEvent,
    isSnapDialog,
    snapName,
    walletState,
  ]) as TemplateValues;

  useEffect(() => {
    templatedValues?.onLoad?.();
  }, [templatedValues]);

  useEffect(() => {
    if (
      pendingConfirmations.length === 0 &&
      (approvalFlows.length === 0 || walletState.unapprovedTxsCount !== 0) &&
      redirectToHomeOnZeroConfirmations
    ) {
      history.push(DEFAULT_ROUTE);
    } else if (
      pendingConfirmations.length &&
      pendingConfirmations.length <= pendingConfirmationIndex
    ) {
      setPendingConfirmationIndex(pendingConfirmations.length - 1);
    }
  }, [
    pendingConfirmations,
    approvalFlows,
    walletState.unapprovedTxsCount,
    history,
    pendingConfirmationIndex,
    redirectToHomeOnZeroConfirmations,
  ]);

  const handleSubmitResult = useCallback(
    (submitResult) => {
      if (submitResult?.length > 0) {
        setLoadingText(templatedValues.submitText);
        setSubmitAlerts(submitResult);
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
    },
    [templatedValues],
  );

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    trackSubmitEvents();

    if (templatedValues.showWarningModal) {
      setShowWarningModal(true);
      return;
    }

    const inputState = INPUT_STATE_CONFIRMATIONS.includes(
      pendingConfirmation.type,
    )
      ? inputStates[pendingConfirmation.type]
      : null;

    const submitResult = await templatedValues.onSubmit(inputState);

    handleSubmitResult(submitResult);
  }, [pendingConfirmation, templatedValues]);

  const handleSnapCancel =
    templatedValues.onCancel || (isSnapAlert ? handleSubmit : null);

  const handleInputChange = useCallback(
    (value) => {
      setInputStates((current) => ({
        ...current,
        [pendingConfirmation.type]: value ?? '',
      }));
    },
    [pendingConfirmation],
  );

  if (!pendingConfirmation) {
    if (approvalFlows.length > 0) {
      const approvalFlowLoadingText =
        approvalFlows[approvalFlows.length - 1]?.loadingText ?? null;

      return <LoadingScreen loadingMessage={approvalFlowLoadingText} />;
    }

    return null;
  }

  return (
    <div className="confirmation-page">
      <Nav
        pendingConfirmations={pendingConfirmations}
        pendingConfirmationIndex={pendingConfirmationIndex}
        onNavigateClick={setPendingConfirmationIndex}
      />
      <Header
        pendingConfirmation={pendingConfirmation}
        pendingConfirmations={pendingConfirmations}
        onSnapCancel={handleSnapCancel}
      />
      <Content
        pendingConfirmation={pendingConfirmation}
        pendingConfirmations={pendingConfirmations}
        templateValues={templatedValues}
        showWarningModal={showWarningModal}
        inputValue={inputStates[pendingConfirmation.type]}
        onInputChange={handleInputChange}
        onSnapCancel={handleSnapCancel}
        onSubmitResult={handleSubmitResult}
      />
      <Footer
        pendingConfirmation={pendingConfirmation}
        isLoading={isLoading}
        loadingText={loadingText}
        submitAlerts={submitAlerts}
        templateValues={templatedValues}
        walletState={walletState}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
