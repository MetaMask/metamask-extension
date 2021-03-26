import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { produce } from 'immer';
import Box from '../../components/ui/box';
import Chip from '../../components/ui/chip';
import MetaMaskTemplateRenderer from '../../components/app/metamask-template-renderer';
import SiteIcon from '../../components/ui/site-icon';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { stripHttpsScheme } from '../../helpers/utils/util';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useOriginMetadata } from '../../hooks/useOriginMetadata';
import { getUnapprovedTemplatedConfirmations } from '../../selectors';
import NetworkDisplay from '../../components/app/network-display/network-display';
import { COLORS, SIZES } from '../../helpers/constants/design-system';
import Callout from '../../components/ui/callout';
import ConfirmationFooter from './components/confirmation-footer';
import { getTemplateValues, getTemplateAlerts } from './templates';

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
 * @param {Object} pendingConfirmation - a pending confirmation waiting for
 *  user approval
 * @returns {[alertState: Object, dismissAlert: Function]} - tuple with
 *  the current alert state and function to dismiss an alert by id
 */
function useAlertState(pendingConfirmation) {
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
      getTemplateAlerts(pendingConfirmation).then((alerts) => {
        if (isMounted && alerts) {
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
  }, [pendingConfirmation]);

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

export default function ConfirmationPage() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const pendingConfirmations = useSelector(
    getUnapprovedTemplatedConfirmations,
    isEqual,
  );
  const [currentPendingConfirmation, setCurrentPendingConfirmation] = useState(
    0,
  );
  const pendingConfirmation = pendingConfirmations[currentPendingConfirmation];
  const originMetadata = useOriginMetadata(pendingConfirmation?.origin);
  const [alertState, dismissAlert] = useAlertState(pendingConfirmation);

  // Generating templatedValues is potentially expensive, and if done on every render
  // will result in a new object. Avoiding calling this generation unnecessarily will
  // improve performance and prevent unnecessary draws.
  const templatedValues = useMemo(() => {
    return pendingConfirmation
      ? getTemplateValues(pendingConfirmation, t, dispatch)
      : {};
  }, [pendingConfirmation, t, dispatch]);

  useEffect(() => {
    // If the number of pending confirmations reduces to zero when the user
    // return them to the default route. Otherwise, if the number of pending
    // confirmations reduces to a number that is less than the currently
    // viewed index, reset the index.
    if (pendingConfirmations.length === 0) {
      history.push(DEFAULT_ROUTE);
    } else if (pendingConfirmations.length <= currentPendingConfirmation) {
      setCurrentPendingConfirmation(pendingConfirmations.length - 1);
    }
  }, [pendingConfirmations, history, currentPendingConfirmation]);
  if (!pendingConfirmation) {
    return null;
  }

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
              <i className="fas fa-chevron-left"></i>
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
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
      <div className="confirmation-page__content">
        <Box justifyContent="center">
          <NetworkDisplay
            colored={false}
            indicatorSize={SIZES.XS}
            labelProps={{ color: COLORS.BLACK }}
          />
        </Box>
        <Box justifyContent="center" padding={[1, 4, 4]}>
          <Chip
            label={stripHttpsScheme(originMetadata.origin)}
            leftIcon={
              <SiteIcon
                icon={originMetadata.icon}
                name={originMetadata.hostname}
                size={32}
              />
            }
          />
        </Box>
        <MetaMaskTemplateRenderer sections={templatedValues.content} />
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
        onApprove={templatedValues.onApprove}
        onCancel={templatedValues.onCancel}
        approveText={templatedValues.approvalText}
        cancelText={templatedValues.cancelText}
      />
    </div>
  );
}
