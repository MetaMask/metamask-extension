import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { AccountsState, getInternalAccounts } from '../../selectors';
import Delegation from './delegation.component';

const mapStateToProps = (state: AccountsState) => {
  return {
    accounts: getInternalAccounts(state),
  };
};

const mapDispatchToProps = () => {
  return {};
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Delegation);
