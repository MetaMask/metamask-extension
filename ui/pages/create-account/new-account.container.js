import { connect } from 'react-redux';
import * as actions from '../../store/actions';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import NewAccountCreateForm from './new-account.component';
import { QUAI_CONTEXTS } from '../../../shared/constants/quai';

const mapStateToProps = (state) => {
  const {
    metamask: { identities = {} },
  } = state;
  const numberOfExistingAccounts = Object.keys(identities).length;
  const newAccountNumber = numberOfExistingAccounts + 1;

  return {
    newAccountNumber,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createAccount: (newAccountName, chainValue) => {
      let range = QUAI_CONTEXTS.filter((obj) => {
        return obj.value == chainValue;
      })[0].byte;
      return dispatch(actions.addNewAccount(range)).then(
        (newAccountAddress) => {
          if (newAccountName) {
            dispatch(
              actions.setAccountLabel(newAccountAddress, newAccountName),
            );
          }
        },
      );
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NewAccountCreateForm);
