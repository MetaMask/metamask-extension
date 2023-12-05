import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { produce } from 'immer';
import log from 'loglevel';

///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { ApprovalType } from '@metamask/controller-utils';
///: END:ONLY_INCLUDE_IF
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import Box from '../../components/ui/box';
import MetaMaskTemplateRenderer from '../../components/app/metamask-template-renderer';
import ConfirmationWarningModal from '../../components/app/confirmation-warning-modal';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { Size, TextColor } from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  getTargetSubjectMetadata,
  ///: END:ONLY_INCLUDE_IF
  getUnapprovedTemplatedConfirmations,
  getUnapprovedTxCount,
  getApprovalFlows,
  getTotalUnapprovedCount,
  useSafeChainsListValidationSelector,
} from '../../selectors';
import NetworkDisplay from '../../components/app/network-display/network-display';
import Callout from '../../components/ui/callout';
import { Icon, IconName } from '../../components/component-library';
import Loading from '../../components/ui/loading-screen';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header';
import { getSnapName } from '../../helpers/utils/util';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../shared/constants/app';
///: END:ONLY_INCLUDE_IF
import { DAY } from '../../../shared/constants/time';
import ConfirmationFooter from './components/confirmation-footer';
import {
  getTemplateValues,
  getTemplateAlerts,
  getTemplateState,
} from './templates';

// TODO(rekmarks): This component and all of its sub-components should probably
// be renamed to "Dialog", now that we are using it in that manner.

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
    if (pendingConfirmation) {
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

export default function ConfirmationPage({
  redirectToHomeOnZeroConfirmations = true,
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const pendingConfirmations = useSelector(
    getUnapprovedTemplatedConfirmations,
    isEqual,
  );
  const unapprovedTxsCount = useSelector(getUnapprovedTxCount);
  const approvalFlows = useSelector(getApprovalFlows, isEqual);
  const totalUnapprovedCount = useSelector(getTotalUnapprovedCount);
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );
  const [approvalFlowLoadingText, setApprovalFlowLoadingText] = useState(null);
  const [currentPendingConfirmation, setCurrentPendingConfirmation] =
    useState(0);
  const pendingConfirmation = pendingConfirmations[currentPendingConfirmation];
  const [matchedChain, setMatchedChain] = useState({});
  const [currencySymbolWarning, setCurrencySymbolWarning] = useState(null);
  const [providerError, setProviderError] = useState(null);
  const [alertState, dismissAlert] = useAlertState(pendingConfirmation, {
    unapprovedTxsCount,
    useSafeChainsListValidation,
    matchedChain,
    providerError,
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

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, pendingConfirmation?.origin),
  );

  const SNAP_DIALOG_TYPE = [
    ApprovalType.SnapDialogAlert,
    ApprovalType.SnapDialogConfirmation,
    ApprovalType.SnapDialogPrompt,
  ];
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_DIALOG_TYPE.push(
    ...Object.values(SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES),
  );
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(snaps,keyring-snaps)
  const isSnapDialog = SNAP_DIALOG_TYPE.includes(pendingConfirmation?.type);

  // When pendingConfirmation is undefined, this will also be undefined
  const snapName =
    isSnapDialog &&
    targetSubjectMetadata &&
    getSnapName(pendingConfirmation?.origin, targetSubjectMetadata);
  ///: END:ONLY_INCLUDE_IF

  const INPUT_STATE_CONFIRMATIONS = [
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    ApprovalType.SnapDialogPrompt,
    ///: END:ONLY_INCLUDE_IF
  ];

  // Generating templatedValues is potentially expensive, and if done on every render
  // will result in a new object. Avoiding calling this generation unnecessarily will
  // improve performance and prevent unnecessary draws.
  const templatedValues = useMemo(() => {
    return pendingConfirmation
      ? getTemplateValues(
          {
            ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            snapName: isSnapDialog && snapName,
            ///: END:ONLY_INCLUDE_IF
            ...pendingConfirmation,
          },
          t,
          dispatch,
          history,
          setInputState,
          { matchedChain, currencySymbolWarning },
        )
      : {};
  }, [
    pendingConfirmation,
    t,
    dispatch,
    history,
    matchedChain,
    currencySymbolWarning,
    ///: BEGIN:ONLY_INCLUDE_IF(snaps,keyring-snaps)
    isSnapDialog,
    snapName,
    ///: END:ONLY_INCLUDE_IF
  ]);

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
    } else if (
      pendingConfirmations.length &&
      pendingConfirmations.length <= currentPendingConfirmation
    ) {
      setCurrentPendingConfirmation(pendingConfirmations.length - 1);
    }
  }, [
    pendingConfirmations,
    approvalFlows,
    totalUnapprovedCount,
    history,
    currentPendingConfirmation,
    redirectToHomeOnZeroConfirmations,
  ]);

  useEffect(() => {
    const childFlow = approvalFlows[approvalFlows.length - 1];

    setApprovalFlowLoadingText(childFlow?.loadingText ?? null);
  }, [approvalFlows]);

  useEffect(() => {
    async function fetchSafeChainsList() {
      try {
        if (useSafeChainsListValidation) {
          const response = await fetchWithCache({
            url: 'https://chainid.network/chains.json',
            cacheOptions: { cacheRefreshTime: DAY },
            functionName: 'getSafeChainsList',
          });
          const safeChainsList = response;
          const _matchedChain = safeChainsList.find(
            (chain) =>
              chain.chainId ===
              parseInt(pendingConfirmation.requestData.chainId, 16),
          );
          setMatchedChain(_matchedChain);
          setProviderError(null);
          if (
            _matchedChain?.nativeCurrency?.symbol?.toLowerCase() ===
            pendingConfirmation.requestData.ticker?.toLowerCase()
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
        // Swallow the error here to not block the user from adding a custom network
      }
    }
    if (pendingConfirmation?.type === ApprovalType.AddEthereumChain) {
      fetchSafeChainsList();
    }
  }, [pendingConfirmation, t, useSafeChainsListValidation]);

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

  return (
    <div className="confirmation-page">
      {pendingConfirmations.length > 1 && (
        <div className="confirmation-page__navigation">
          <p>
            {t('xOfYPending', [
              currentPendingConfirmation + 1,
              pendingConfirmations.length,
            ])}
          </p>
          {currentPendingConfirmation > 0 && (
            <button
              className="confirmation-page__navigation-button"
              onClick={() =>
                setCurrentPendingConfirmation(currentPendingConfirmation - 1)
              }
            >
              <Icon name={IconName.ArrowLeft} />
            </button>
          )}
          <button
            className="confirmation-page__navigation-button"
            disabled={
              currentPendingConfirmation + 1 === pendingConfirmations.length
            }
            onClick={() =>
              setCurrentPendingConfirmation(currentPendingConfirmation + 1)
            }
          >
            <Icon name={IconName.ArrowRight} />
          </button>
        </div>
      )}
      <div className="confirmation-page__content">
        {templatedValues.networkDisplay ? (
          <Box justifyContent="center" marginTop={2}>
            <NetworkDisplay
              indicatorSize={Size.XS}
              labelProps={{ color: TextColor.textDefault }}
            />
          </Box>
        ) : null}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(snaps)
          isSnapDialog && (
            <SnapAuthorshipHeader snapId={pendingConfirmation?.origin} />
          )
          ///: END:ONLY_INCLUDE_IF
        }
        <MetaMaskTemplateRenderer sections={templatedValues.content} />
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
      </div>
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
        ///: BEGIN:ONLY_INCLUDE_IF(snaps,keyring-snaps)
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
        ///: END:ONLY_INCLUDE_IF
        onSubmit={handleSubmit}
        onCancel={templatedValues.onCancel}
        submitText={templatedValues.submitText}
        cancelText={templatedValues.cancelText}
        loadingText={loadingText || templatedValues.loadingText}
        loading={loading}
        submitAlerts={submitAlerts.map((alert, idx) => (
          <Callout key={alert.id} severity={alert.severity} isFirst={idx === 0}>
            <MetaMaskTemplateRenderer sections={alert.content} />
          </Callout>
        ))}
      />
    </div>
  );
}

ConfirmationPage.propTypes = {
  redirectToHomeOnZeroConfirmations: PropTypes.bool,
};
