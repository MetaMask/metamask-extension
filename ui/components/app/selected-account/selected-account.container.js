import { connect } from 'react-redux';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import SelectedAccount from './selected-account.component';

const mapStateToProps = (state) => {
  return {
    selectedAccount: getSelectedInternalAccount(state),
  };
};

export default connect(mapStateToProps)(SelectedAccount);
