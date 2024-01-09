import { connect } from 'react-redux';
import {
  getSelectedInternalAccount,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getAccountType,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getCustodyAccountDetails,
  getIsCustodianSupportedChain,
} from '../../../selectors/institutional/selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
///: END:ONLY_INCLUDE_IF
import SelectedAccount from './selected-account.component';

const mapStateToProps = (state) => {
  return {
    selectedAccount: getSelectedInternalAccount(state),
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    accountType: getAccountType(state),
    accountDetails: getCustodyAccountDetails(state),
    provider: getProviderConfig(state),
    isCustodianSupportedChain: getIsCustodianSupportedChain(state),
    ///: END:ONLY_INCLUDE_IF
  };
};

export default connect(mapStateToProps)(SelectedAccount);
