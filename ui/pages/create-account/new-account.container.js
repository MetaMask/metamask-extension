import { connect } from 'react-redux';
import * as actions from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { KeyringType } from '../../../shared/constants/keyring';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import NewAccountCreateForm from './new-account.component';

const mapStateToProps = (state) => {
  const {
    metamask: { identities = {}, keyrings },
  } = state;
  const numberOfExistingAccounts = Object.keys(identities).length;
  const newAccountNumber = numberOfExistingAccounts + 1;

  const hdKeyringExists = keyrings.some((kr) => kr.type === KeyringType.hdKeyTree)

  return {
    newAccountNumber,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    accounts: getMetaMaskAccountsOrdered(state),
    hdKeyringExists,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createAccount: (newAccountName) => {
      return dispatch(actions.addNewAccount()).then((newAccountAddress) => {
        if (newAccountName) {
          dispatch(actions.setAccountLabel(newAccountAddress, newAccountName));
        }
      });
    },
    createNewHDKeychainAndFirstAccount: (newAccountName) => {
      return dispatch(actions.createNewHDKeychainAndFirstAccount()).then((newAccountAddress) => {
        if (newAccountName) {
          dispatch(actions.setAccountLabel(newAccountAddress, newAccountName));
        }
      });
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NewAccountCreateForm);
