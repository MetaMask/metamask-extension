import { findKey } from 'lodash'
import { connect } from 'react-redux'
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites'
import {
  getAddressConnectedDomainMap,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from '../../../selectors'
import ConnectedStatusIndicator from './connected-status-indicator.component'

const mapStateToProps = (state) => {
  const selectedAddress = getSelectedAddress(state)
  const addressConnectedDomainMap = getAddressConnectedDomainMap(state)
  const originOfCurrentTab = getOriginOfCurrentTab(state)

  const selectedAddressDomainMap = addressConnectedDomainMap[selectedAddress]
  const currentTabIsConnectedToSelectedAddress = Boolean(
    selectedAddressDomainMap && selectedAddressDomainMap[originOfCurrentTab],
  )

  let status
  if (currentTabIsConnectedToSelectedAddress) {
    status = STATUS_CONNECTED
  } else if (findKey(addressConnectedDomainMap, originOfCurrentTab)) {
    status = STATUS_CONNECTED_TO_ANOTHER_ACCOUNT
  } else {
    status = STATUS_NOT_CONNECTED
  }

  return {
    status,
  }
}

export default connect(mapStateToProps)(ConnectedStatusIndicator)
