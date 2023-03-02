import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getInstitutionalConnectRequests } from '../../../ducks/mmi/institutional/institutional';
import { getMMIActions, setProviderType } from '../../../store/actions';
import ConfirmAddCustodianToken from './confirm-add-custodian-token.component';

const mapStateToProps = (state) => {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    connectRequests: getInstitutionalConnectRequests(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  const MMIActions = getMMIActions();
  return {
    setProviderType: (type) => dispatch(setProviderType(type)),
    removeAddTokenConnectRequest: ({ origin, apiUrl, token }) =>
      dispatch(
        MMIActions.removeAddTokenConnectRequest({ origin, apiUrl, token }),
      ),
    setCustodianConnectRequest: ({
      token,
      apiUrl,
      custodianType,
      custodianName,
    }) =>
      dispatch(
        MMIActions.setCustodianConnectRequest({
          token,
          apiUrl,
          custodianType,
          custodianName,
        }),
      ),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmAddCustodianToken);
