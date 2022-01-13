import React, {
  Component,
  createContext,
  useEffect,
  useCallback,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { captureException } from '@sentry/browser';

import {
  getAccountType,
  getNumberOfAccounts,
  getNumberOfTokens,
} from '../selectors/selectors';
import { getSendAsset, ASSET_TYPES } from '../ducks/send';
import { txDataSelector } from '../selectors/confirm-transaction';
import { getEnvironmentType } from '../../app/scripts/lib/util';
import { trackMetaMetricsEvent } from '../store/actions';
import { getNativeCurrency } from '../ducks/metamask/metamask';

export const MetaMetricsContext = createContext(() => {
  captureException(
    Error(
      `MetaMetrics context function was called from a react node that is not a descendant of a MetaMetrics context provider`,
    ),
  );
});

export function MetaMetricsProvider({ children }) {
  const txData = useSelector(txDataSelector) || {};
  const environmentType = getEnvironmentType();
  const activeAsset = useSelector(getSendAsset);
  const nativeAssetSymbol = useSelector(getNativeCurrency);
  const accountType = useSelector(getAccountType);
  const confirmTransactionOrigin = txData.origin;
  const numberOfTokens = useSelector(getNumberOfTokens);
  const numberOfAccounts = useSelector(getNumberOfAccounts);
  const history = useHistory();
  const [state, setState] = useState(() => ({
    currentPath: new URL(window.location.href).pathname,
    previousPath: '',
  }));

  const { currentPath } = state;

  useEffect(() => {
    const unlisten = history.listen(() =>
      setState((prevState) => ({
        currentPath: new URL(window.location.href).pathname,
        previousPath: prevState.currentPath,
      })),
    );
    // remove this listener if the component is no longer mounted
    return unlisten;
  }, [history]);

  const metricsEvent = useCallback(
    (config = {}, overrides = {}) => {
      const { eventOpts = {} } = config;
      const referrer = confirmTransactionOrigin
        ? { url: confirmTransactionOrigin }
        : undefined;
      const page = {
        path: currentPath,
      };
      return trackMetaMetricsEvent(
        {
          event: eventOpts.name,
          category: eventOpts.category,
          properties: {
            action: eventOpts.action,
            number_of_tokens: numberOfTokens,
            number_of_accounts: numberOfAccounts,
            active_currency:
              activeAsset.type === ASSET_TYPES.NATIVE
                ? nativeAssetSymbol
                : activeAsset?.details?.symbol,
            account_type: accountType,
            is_new_visit: config.is_new_visit,
            // the properties coming from this key will not match our standards for
            // snake_case on properties, and they may be redundant and/or not in the
            // proper location (origin not as a referrer, for example). This is a temporary
            // solution to not lose data, and the entire event system will be reworked in
            // forthcoming PRs to deprecate the old Matomo events in favor of the new schema.
            ...config.customVariables,
          },
          page,
          referrer,
          environmentType,
        },
        {
          isOptIn: config.isOptIn,
          excludeMetaMetricsId:
            eventOpts.excludeMetaMetricsId ??
            overrides.excludeMetaMetricsId ??
            false,
          metaMetricsId: config.metaMetricsId,
          matomoEvent: true,
          flushImmediately: config.flushImmediately,
        },
      );
    },
    [
      accountType,
      currentPath,
      confirmTransactionOrigin,
      activeAsset,
      nativeAssetSymbol,
      numberOfTokens,
      numberOfAccounts,
      environmentType,
    ],
  );

  return (
    <MetaMetricsContext.Provider value={metricsEvent}>
      {children}
    </MetaMetricsContext.Provider>
  );
}

MetaMetricsProvider.propTypes = { children: PropTypes.node };

export class LegacyMetaMetricsProvider extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  static defaultProps = {
    children: undefined,
  };

  static contextType = MetaMetricsContext;

  static childContextTypes = {
    metricsEvent: PropTypes.func,
  };

  getChildContext() {
    return {
      metricsEvent: this.context,
    };
  }

  render() {
    return this.props.children;
  }
}
