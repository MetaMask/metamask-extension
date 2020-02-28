import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import AssetList from './asset-list.component'
import { setSelectedToken } from '../../../store/actions'
import { getSelectedAccount } from '../../../selectors/selectors'

function mapStateToProps (state) {
  return {
    selectedAccount: getSelectedAccount(state),
    selectedTokenAddress: state.metamask.selectedTokenAddress,
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
