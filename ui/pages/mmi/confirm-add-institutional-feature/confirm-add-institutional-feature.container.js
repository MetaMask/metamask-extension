import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getInstitutionalConnectRequests } from '../../ducks/institutional/institutional';
import { getMMIActions } from '../../store/actions';
import ConfirmAddInstitutionalFeature from './confirm-add-institutional-feature.component';

const mapStateToProps = (state) => {
  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    connectRequests: getInstitutionalConnectRequests(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  const MMIActions = getMMIActions();
  return {
    removeConnectInstitutionalFeature: ({ origin, projectId }) =>
      dispatch(
        MMIActions.removeConnectInstitutionalFeature({ origin, projectId }),
      ),
    setComplianceAuthData: ({ clientId, projectId }) =>
      dispatch(MMIActions.setComplianceAuthData({ clientId, projectId })),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmAddInstitutionalFeature);
