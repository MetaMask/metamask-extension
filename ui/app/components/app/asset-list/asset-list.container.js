import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import AssetList from './asset-list.component'
import { setSelectedToken } from '../../../store/actions'

function mapStateToProps (state) {
  return {
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
