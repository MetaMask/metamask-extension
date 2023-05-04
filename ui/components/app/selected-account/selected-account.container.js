import { connect } from 'react-redux';
import {
  getSelectedIdentity,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getAccountType,
  getCustodyAccountDetails,
  getProvider,
  getIsCustodianSupportedChain,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import SelectedAccount from './selected-account.component';

const mapStateToProps = (state) => {
  return {
    selectedIdentity: getSelectedIdentity(state),
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    accountType: getAccountType(state),
    accountDetails: getCustodyAccountDetails(state),
    provider: getProvider(state),
    isCustodianSupportedChain: getIsCustodianSupportedChain(state),
    ///: END:ONLY_INCLUDE_IN
  };
};

export default connect(mapStateToProps)(SelectedAccount);
