/* eslint-disable react/prop-types */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useContext,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { isEqual } from 'lodash';
import { produce } from 'immer';
import log from 'loglevel';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { CHAIN_SPEC_URL } from '../../../../shared/constants/network';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import MetaMaskTemplateRenderer from '../../../components/app/metamask-template-renderer';
import ConfirmationWarningModal from '../components/confirmation-warning-modal';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getMemoizedUnapprovedTemplatedConfirmations,
  getUnapprovedTxCount,
  getApprovalFlows,
  getTotalUnapprovedCount,
  useSafeChainsListValidationSelector,
  getSnapsMetadata,
  getHideSnapBranding,
} from '../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import Callout from '../../../components/ui/callout';
import { Box } from '../../../components/component-library';
import Loading from '../../../components/ui/loading-screen';
import SnapAuthorshipHeader from '../../../components/app/snaps/snap-authorship-header';
import { SnapUIRenderer } from '../../../components/app/snaps/snap-ui-renderer';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
///: END:ONLY_INCLUDE_IF
import { DAY } from '../../../../shared/constants/time';
import { Nav } from '../components/confirm/nav';
import { ConfirmContextProvider } from '../context/confirm';
import { useConfirmationNavigation } from '../hooks/useConfirmationNavigation';
import ConfirmationFooter from './components/confirmation-footer';
import {
  getTemplateValues,
  getTemplateAlerts,
  getTemplateState,
} from './templates';

const SNAP_CUSTOM_UI_DIALOG = Object.values(DIALOG_APPROVAL_TYPES);

/**
 * a very simple reducer using produce from Immer to keep state manipulation
 * immutable and painless. This state is not stored in redux state because it
 * should persist only for the lifespan of the current session, and will only
 * be used on this page. Dismissing alerts for confirmations should persist
 * while the user pages back and forth between confirmations. However, if the
 * user closes the confirmation window and later reopens the extension they
 * should be displayed the alerts again.
 */
const alertStateReducer = produce((state, action) => {
  switch (action.type) {
    case 'dismiss':
      if (state?.[action.confirmationId]?.[action.alertId]) {
        state[action.confirmationId][action.alertId].dismissed = true;
      }
      break;
    case 'set':
      if (!state[action.confirmationId]) {
        state[action.confirmationId] = {};
      }
      action.alerts.forEach((alert) => {
        state[action.confirmationId][alert.id] = {
          ...alert,
          dismissed: false,
        };
      });
      break;
    default:
      throw new Error(
        'You must provide a type when dispatching an action for alertState',
      );
  }
});

/**
 * Encapsulates the state and effects needed to manage alert state for the
 * confirmation page in a custom hook. This hook is not likely to be used
 * outside of this file, but it helps to reduce complexity of the primary
 * component.
 *
 * @param {object} pendingConfirmation - a pending confirmation waiting for
 * user approval
 * @param {object} state - The state object consist of required info to determine alerts.
 * @param state.unapprovedTxsCount
 * @param state.useSafeChainsListValidation
 * @param state.matchedChain
 * @param state.providerError
 * @param state.preventAlertsForAddChainValidation
 * @returns {[alertState: object, dismissAlert: Function]} A tuple with
 * the current alert state and function to dismiss an alert by id
 */
function useAlertState(
  pendingConfirmation,
  {
    unapprovedTxsCount,
    useSafeChainsListValidation,
    matchedChain,
    providerError,
    preventAlertsForAddChainValidation = false,
  } = {},
) {
  const [alertState, dispatch] = useReducer(alertStateReducer, {});

  /**
   * Computation of the current alert state happens every time the current
   * pendingConfirmation changes. The async function getTemplateAlerts is
   * responsible for returning alert state. Setting state on unmounted
   * components is an anti-pattern, so we use a isMounted variable to keep
   * track of the current state of the component. Returning a function that
   * sets isMounted to false when the component is unmounted.
   */
  useEffect(() => {
    let isMounted = true;
    if (pendingConfirmation && !preventAlertsForAddChainValidation) {
      getTemplateAlerts(pendingConfirmation, {
        unapprovedTxsCount,
        useSafeChainsListValidation,
        matchedChain,
        providerError,
      }).then((alerts) => {
        if (isMounted && alerts.length > 0) {
          dispatch({
            type: 'set',
            confirmationId: pendingConfirmation.id,
            alerts,
          });
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [
    pendingConfirmation,
    unapprovedTxsCount,
    useSafeChainsListValidation,
    matchedChain,
    providerError,
    preventAlertsForAddChainValidation,
  ]);

  const dismissAlert = useCallback(
    (alertId) => {
      dispatch({
        type: 'dismiss',
        confirmationId: pendingConfirmation.id,
        alertId,
      });
    },
    [pendingConfirmation],
  );

  return [alertState, dismissAlert];
}

function useTemplateState(pendingConfirmation) {
  const [templateState, setTemplateState] = useState({});
  useEffect(() => {
    let isMounted = true;
    if (pendingConfirmation) {
      getTemplateState(pendingConfirmation).then((state) => {
        if (isMounted && Object.values(state).length > 0) {
          setTemplateState((prevState) => ({
            ...prevState,
            [pendingConfirmation.id]: state,
          }));
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [pendingConfirmation]);

  return [templateState];
}

function Header({ confirmation, isSnapCustomUIDialog, onCancel }) {
  const { count } = useConfirmationNavigation();
  const { origin } = confirmation ?? {};

  const hideSnapBranding = useSelector((state) =>
    getHideSnapBranding(state, origin),
  );

  const requiresSnapHeader = isSnapCustomUIDialog && !hideSnapBranding;

  if (count <= 1 && !requiresSnapHeader) {
    return null;
  }

  return (
    <Box style={{ width: '100%', position: 'relative' }}>
      <Nav confirmationId={confirmation?.id} />
      {requiresSnapHeader && (
        <SnapAuthorshipHeader snapId={origin} onCancel={onCancel} />
      )}
    </Box>
  );
}

export default function ConfirmationPage({
  redirectToHomeOnZeroConfirmations = true,
}) {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const pendingConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );
  const unapprovedTxsCount = useSelector(getUnapprovedTxCount);
  const approvalFlows = useSelector(getApprovalFlows, isEqual);
  const totalUnapprovedCount = useSelector(getTotalUnapprovedCount);
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const [approvalFlowLoadingText, setApprovalFlowLoadingText] = useState(null);

  const { id } = useParams();
  const pendingRoutedConfirmation = pendingConfirmations.find(
    (confirmation) => confirmation.id === id,
  );

  const pendingConfirmation =
    pendingRoutedConfirmation ?? pendingConfirmations[0];

  const [matchedChain, setMatchedChain] = useState({});
  const [chainFetchComplete, setChainFetchComplete] = useState(false);
  const preventAlertsForAddChainValidation =
    pendingConfirmation?.type === ApprovalType.AddEthereumChain &&
    !chainFetchComplete;
  const [currencySymbolWarning, setCurrencySymbolWarning] = useState(null);
  const [providerError, setProviderError] = useState(null);
  const [alertState, dismissAlert] = useAlertState(pendingConfirmation, {
    unapprovedTxsCount,
    useSafeChainsListValidation,
    matchedChain,
    providerError,
    preventAlertsForAddChainValidation,
  });
  const [templateState] = useTemplateState(pendingConfirmation);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [inputStates, setInputStates] = useState({});
  const setInputState = (key, value) => {
    setInputStates((currentState) => ({ ...currentState, [key]: value }));
  };
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState();

  const [submitAlerts, setSubmitAlerts] = useState([]);

  const snapsMetadata = useSelector(getSnapsMetadata);

  const name = snapsMetadata[pendingConfirmation?.origin]?.name;

  const SNAP_DIALOG_TYPE = Object.values(DIALOG_APPROVAL_TYPES);

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_DIALOG_TYPE.push(
    ...Object.values(SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES),
  );
  ///: END:ONLY_INCLUDE_IF

  const isSnapDialog = SNAP_DIALOG_TYPE.includes(pendingConfirmation?.type);
  const isSnapCustomUIDialog = SNAP_CUSTOM_UI_DIALOG.includes(
    pendingConfirmation?.type,
  );
  const isSnapPrompt =
    pendingConfirmation?.type === ApprovalType.SnapDialogPrompt;

  const isSnapDefaultDialog =
    pendingConfirmation?.type === DIALOG_APPROVAL_TYPES.default;

  // When pendingConfirmation is undefined, this will also be undefined
  const snapName = isSnapDialog && name;

  const INPUT_STATE_CONFIRMATIONS = [ApprovalType.SnapDialogPrompt];

  // Generating templatedValues is potentially expensive, and if done on every render
  // will result in a new object. Avoiding calling this generation unnecessarily will
  // improve performance and prevent unnecessary draws.
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
          {
            matchedChain,
            currencySymbolWarning,
            existingNetworkConfiguration:
              networkConfigurationsByChainId?.[
                pendingConfirmation.requestData?.chainId
              ],
          },
          // Passing `t` in the contexts object is a bit redundant but since it's a
          // context too, it makes sense (for completeness)
          { t, trackEvent },
        )
      : {};
  }, [
    pendingConfirmation,
    t,
    dispatch,
    history,
    matchedChain,
    currencySymbolWarning,
    trackEvent,
    isSnapDialog,
    snapName,
    networkConfigurationsByChainId,
  ]);

  useEffect(() => {
    if (templatedValues.onLoad) {
      templatedValues.onLoad();
    }
  }, [templatedValues]);

  useEffect(() => {
    // If the number of pending confirmations reduces to zero when the user
    // return them to the default route. Otherwise, if the number of pending
    // confirmations reduces to a number that is less than the currently
    // viewed index, reset the index.
    if (
      pendingConfirmations.length === 0 &&
      (approvalFlows.length === 0 || totalUnapprovedCount !== 0) &&
      redirectToHomeOnZeroConfirmations
    ) {
      history.push(DEFAULT_ROUTE);
    }
  }, [
    pendingConfirmations,
    approvalFlows,
    totalUnapprovedCount,
    history,
    redirectToHomeOnZeroConfirmations,
  ]);

  useEffect(() => {
    const childFlow = approvalFlows[approvalFlows.length - 1];

    setApprovalFlowLoadingText(childFlow?.loadingText ?? null);
  }, [approvalFlows]);

  useEffect(() => {
    async function fetchSafeChainsList(_pendingConfirmation) {
      try {
        if (useSafeChainsListValidation) {
          const response = await fetchWithCache({
            url: CHAIN_SPEC_URL,
            allowStale: true,
            cacheOptions: { cacheRefreshTime: DAY },
            functionName: 'getSafeChainsList',
          });
          const safeChainsList = response;
          const _matchedChain = safeChainsList.find(
            (chain) =>
              chain.chainId ===
              parseInt(_pendingConfirmation.requestData.chainId, 16),
          );
          setMatchedChain(_matchedChain);
          setChainFetchComplete(true);
          setProviderError(null);
          if (
            _matchedChain?.nativeCurrency?.symbol?.toLowerCase() ===
            _pendingConfirmation.requestData.ticker?.toLowerCase()
          ) {
            setCurrencySymbolWarning(null);
          } else {
            setCurrencySymbolWarning(
              t('chainListReturnedDifferentTickerSymbol', [
                _matchedChain?.nativeCurrency?.symbol,
              ]),
            );
          }
        }
      } catch (error) {
        log.warn('Failed to fetch the chainList from chainid.network', error);
        setProviderError(error);
        setMatchedChain(null);
        setCurrencySymbolWarning(null);
        setChainFetchComplete(true);
        // Swallow the error here to not block the user from adding a custom network
      }
    }
    if (pendingConfirmation?.type === ApprovalType.AddEthereumChain) {
      fetchSafeChainsList(pendingConfirmation);
    }
  }, [
    pendingConfirmation,
    t,
    useSafeChainsListValidation,
    setChainFetchComplete,
  ]);

  if (!pendingConfirmation) {
    if (approvalFlows.length > 0) {
      return <Loading loadingMessage={approvalFlowLoadingText} />;
    }

    return null;
  }

  const hasInputState = (type) => {
    return INPUT_STATE_CONFIRMATIONS.includes(type);
  };

  const getInputState = (type) => {
    return inputStates[type] ?? '';
  };

  const onInputChange = (event) =>
    setInputState(pendingConfirmation?.type, event.target.value ?? '');

  const handleSubmitResult = (submitResult) => {
    if (submitResult?.length > 0) {
      setLoadingText(templatedValues.submitText);
      setSubmitAlerts(submitResult);
      setLoading(true);
    } else {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    setLoading(true);

    if (
      pendingConfirmation?.requestData?.fromNetworkConfiguration?.chainId &&
      pendingConfirmation?.requestData?.toNetworkConfiguration?.chainId
    ) {
      trackEvent({
        category: MetaMetricsEventCategory.Network,
        event: MetaMetricsEventName.NavNetworkSwitched,
        properties: {
          location: 'Switch Modal',
          from_network:
            pendingConfirmation.requestData.fromNetworkConfiguration.chainId,
          to_network:
            pendingConfirmation.requestData.toNetworkConfiguration.chainId,
          referrer: {
            url: window.location.origin,
          },
        },
      });
    }

    if (templateState[pendingConfirmation.id]?.useWarningModal) {
      setShowWarningModal(true);
    } else {
      const inputState = hasInputState(pendingConfirmation.type)
        ? getInputState(pendingConfirmation.type)
        : null;
      // submit result is an array of errors or empty on success
      const submitResult = await templatedValues.onSubmit(inputState);
      handleSubmitResult(submitResult);
    }
  };

  const handleSnapDialogCancel =
    templatedValues.onCancel ||
    // /!\ Treat cancel as submit only if approval type is appropriate /!\
    (pendingConfirmation?.type === ApprovalType.SnapDialogAlert
      ? handleSubmit
      : null);

  return (
    <ConfirmContextProvider>
      <div className="confirmation-page">
        <Header
          confirmation={pendingConfirmation}
          isSnapCustomUIDialog={isSnapCustomUIDialog}
          onCancel={handleSnapDialogCancel}
        />
        <Box
          className="confirmation-page__content"
          padding={isSnapCustomUIDialog ? 0 : 4}
          style={{
            overflowY: 'auto',
          }}
        >
          {isSnapCustomUIDialog ? (
            <SnapUIRenderer
              snapId={pendingConfirmation?.origin}
              interfaceId={pendingConfirmation?.requestData.id}
              isPrompt={isSnapPrompt}
              inputValue={
                isSnapPrompt && inputStates[pendingConfirmation?.type]
              }
              onInputChange={isSnapPrompt && onInputChange}
              placeholder={
                isSnapPrompt && pendingConfirmation?.requestData.placeholder
              }
              useDelineator={false}
              onCancel={handleSnapDialogCancel}
              useFooter={isSnapDefaultDialog}
            />
          ) : (
            <MetaMaskTemplateRenderer sections={templatedValues.content} />
          )}
          {showWarningModal && (
            <ConfirmationWarningModal
              onSubmit={async () => {
                const res = await templatedValues.onSubmit();
                await handleSubmitResult(res);
                setShowWarningModal(false);
              }}
              onCancel={templatedValues.onCancel}
            />
          )}
        </Box>
        {!isSnapDefaultDialog && (
          <ConfirmationFooter
            alerts={
              alertState[pendingConfirmation.id] &&
              Object.values(alertState[pendingConfirmation.id])
                .filter((alert) => alert.dismissed === false)
                .map((alert, idx, filtered) => (
                  <Callout
                    key={alert.id}
                    severity={alert.severity}
                    dismiss={() => dismissAlert(alert.id)}
                    isFirst={idx === 0}
                    isLast={idx === filtered.length - 1}
                    isMultiple={filtered.length > 1}
                  >
                    <MetaMaskTemplateRenderer sections={alert.content} />
                  </Callout>
                ))
            }
            style={
              isSnapDialog
                ? {
                    boxShadow:
                      'var(--shadow-size-lg) var(--color-shadow-default)',
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
            onSubmit={!templatedValues.hideSubmitButton && handleSubmit}
            onCancel={templatedValues.onCancel}
            submitText={templatedValues.submitText}
            cancelText={templatedValues.cancelText}
            loadingText={loadingText || templatedValues.loadingText}
            loading={loading}
            submitAlerts={submitAlerts.map((alert, idx) => (
              <Callout
                key={alert.id}
                severity={alert.severity}
                isFirst={idx === 0}
              >
                <MetaMaskTemplateRenderer sections={alert.content} />
              </Callout>
            ))}
          />
        )}
      </div>
    </ConfirmContextProvider>
  );
}

ConfirmationPage.propTypes = {
  redirectToHomeOnZeroConfirmations: PropTypes.bool,
};
