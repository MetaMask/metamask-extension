import { connect } from 'react-redux';
import {
  setUseTransactionSimulations,
  setUseExternalNameSources,
  setSecurityAlertsEnabled,
  setFeatureFlag,
  setSmartTransactionsPreferenceEnabled,
  setDismissSmartAccountSuggestionEnabled,
} from '../../../store/actions';
import { getIsSecurityAlertsEnabled } from '../../../selectors';
import { getIsActiveShieldSubscription } from '../../../selectors/subscription';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/modules/selectors';
import { getPreferences } from '../../../selectors';
import TransactionsTab from './transactions-tab.component';

const mapStateToProps = (state) => {
  const { metamask } = state;
  const { useExternalNameSources } = metamask;
  const { useTransactionSimulations } = metamask;
  const { dismissSmartAccountSuggestionEnabled } = getPreferences(state);

  return {
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    useTransactionSimulations: Boolean(useTransactionSimulations),
    useExternalNameSources: Boolean(useExternalNameSources),
    smartTransactionsEnabled: getSmartTransactionsPreferenceEnabled(state),
    sendHexData: metamask.featureFlags?.sendHexData ?? false,
    hasActiveShieldSubscription: getIsActiveShieldSubscription(state),
    dismissSmartAccountSuggestionEnabled: Boolean(
      dismissSmartAccountSuggestionEnabled,
    ),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setSecurityAlertsEnabled: (value) => setSecurityAlertsEnabled(value),
    setUseTransactionSimulations: (value) => {
      dispatch(setUseTransactionSimulations(value));
    },
    setUseExternalNameSources: (value) => {
      dispatch(setUseExternalNameSources(value));
    },
    setSmartTransactionsEnabled: (value) =>
      dispatch(setSmartTransactionsPreferenceEnabled(value)),
    setHexDataFeatureFlag: (shouldShow) => {
      dispatch(setFeatureFlag('sendHexData', shouldShow));
    },
    setDismissSmartAccountSuggestionEnabled: (value) => {
      dispatch(setDismissSmartAccountSuggestionEnabled(value));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TransactionsTab);
