import { connect } from 'react-redux'
import ConnectedStatusIndicator from './connected-status-indicator.component'
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites'
import {
  getAddressConnectedDomainMap,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from '../../../selectors/selectors'


const mapStateToProps = (state) => {
  const selectedAddress = getSelectedAddress(state)
  const addressConnectedDomainMap = getAddressConnectedDomainMap(state)
  const originOfCurrentTab = getOriginOfCurrentTab(state)

  const selectedAddressDomainMap = addressConnectedDomainMap[selectedAddress]
  const currentTabIsConnectedToSelectedAddress = selectedAddressDomainMap && selectedAddressDomainMap[originOfCurrentTab]

  const allConnectedDomains = Object.values(addressConnectedDomainMap).reduce((acc, val) => {
    return { ...acc, ...val }
  }, {})
  const currentTabIsConnectToSomeOtherAddress = !currentTabIsConnectedToSelectedAddress && allConnectedDomains[originOfCurrentTab]

  let status
  if (currentTabIsConnectedToSelectedAddress) {
    status = STATUS_CONNECTED
  } else if (currentTabIsConnectToSomeOtherAddress) {
    status = STATUS_CONNECTED_TO_ANOTHER_ACCOUNT
  } else {
    status = STATUS_NOT_CONNECTED
  }

  return {
    status,
  }
}

export default connect(mapStateToProps)(ConnectedStatusIndicator)
