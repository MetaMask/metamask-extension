import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import AssetList from './asset-list.component'
import { setSelectedToken } from '../../../store/actions'
import { getCurrentAccountWithSendEtherInfo, getShouldShowFiat } from '../../../selectors/selectors'

function mapStateToProps (state) {
  return {
    selectedAccountBalance: getCurrentAccountWithSendEtherInfo(state).balance,
    selectedTokenAddress: state.metamask.selectedTokenAddress,
    showFiat: getShouldShowFiat(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setSelectedToken: (tokenAddress) => dispatch(setSelectedToken(tokenAddress)),
    unsetSelectedToken: () => dispatch(setSelectedToken()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(AssetList)
