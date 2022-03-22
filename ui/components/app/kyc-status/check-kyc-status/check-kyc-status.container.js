import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { getSelectedAddress, getSelectedAccount } from '../../../../selectors';
import { signMsg, getPrivateKey } from '../../../../store/actions';
import CheckKycStatus from './check-kyc-status.component';

function mapStateToProps(state) {
  // console.log('state', state)
  const currentAddress = getSelectedAddress(state);
  const selectedAccount = getSelectedAccount(state);
  return {
    currentAddress,
    selectedAccount,
  };
}
const mapDispatchToProps = (dispatch) => {
  return {
    getPrivateKey: (address) => dispatch(getPrivateKey(address)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CheckKycStatus);
