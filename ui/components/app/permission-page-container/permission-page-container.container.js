import { connect } from 'react-redux';
import { getMetaMaskIdentities } from '../../../selectors';
import { clearPostApprovalRedirectURL } from '../../../ducks/app/app';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;

  const allIdentities = getMetaMaskIdentities(state);
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    allIdentitiesSelected,
    postApprovalRedirectURL: state.appState.postApprovalRedirectURL,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    clearPostApprovalRedirectURL: () => {
      return dispatch(clearPostApprovalRedirectURL());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(PermissionPageContainer);
