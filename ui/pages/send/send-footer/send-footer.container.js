import { connect } from 'react-redux';
import { addToAddressBook } from '../../../store/actions';
import {
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from '../../../selectors';
import {
  resetSendState,
  getGasPrice,
  getSendTo,
  getSendErrors,
  isSendFormInvalid,
  signTransaction,
} from '../../../ducks/send';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { getSendToAccounts } from '../../../ducks/metamask/metamask';
import SendFooter from './send-footer.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter);

function addressIsNew(toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase();
  const foundMatching = toAccounts.some(
    ({ address }) => address.toLowerCase() === newAddressNormalized,
  );
  return !foundMatching;
}

function mapStateToProps(state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state);
  const gasPrice = getGasPrice(state);
  const activeButtonIndex = getDefaultActiveButtonIndex(
    gasButtonInfo,
    gasPrice,
  );
  const gasEstimateType =
    activeButtonIndex >= 0
      ? gasButtonInfo[activeButtonIndex].gasEstimateType
      : 'custom';

  return {
    disabled: isSendFormInvalid(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    sendErrors: getSendErrors(state),
    gasEstimateType,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    resetSendState: () => dispatch(resetSendState()),
    sign: () => dispatch(signTransaction()),
    addToAddressBookIfNew: (newAddress, toAccounts, nickname = '') => {
      const hexPrefixedAddress = addHexPrefix(newAddress);
      if (addressIsNew(toAccounts, hexPrefixedAddress)) {
        // TODO: nickname, i.e. addToAddressBook(recipient, nickname)
        dispatch(addToAddressBook(hexPrefixedAddress, nickname));
      }
    },
  };
}
