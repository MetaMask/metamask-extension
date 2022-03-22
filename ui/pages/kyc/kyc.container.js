import { connect } from 'react-redux';
import { getSelectedAddress } from '../../selectors';

import { getSendToAccounts } from '../../ducks/metamask/metamask';
import KycComponent from './kyc.component';

function mapStateToProps(state) {
  const currentAddress = getSelectedAddress(state);
  return {
    currentAddress,
  };
}

export default connect(mapStateToProps)(KycComponent);
