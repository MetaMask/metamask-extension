import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { getMetaMaskIdentities } from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps;

  const allIdentities = getMetaMaskIdentities(state);
  const allIdentitiesSelected =
    Object.keys(selectedIdentities).length ===
      Object.keys(allIdentities).length && selectedIdentities.length > 1;

  return {
    allIdentitiesSelected,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(PermissionPageContainer);
