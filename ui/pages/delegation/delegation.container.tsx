import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { AccountsState, getSelectedInternalAccount } from '../../selectors';
import Delegation from './delegation.component';

const mapStateToProps = (state: AccountsState) => {
  return {
    currentAccount: getSelectedInternalAccount(state),
  };
};

const mapDispatchToProps = () => {
  return {};
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Delegation);
