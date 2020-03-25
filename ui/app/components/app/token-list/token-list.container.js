import { connect } from 'react-redux'
import { getSelectedAddress } from '../../../selectors/selectors'
import TokenList from './token-list.component'

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    tokens: state.metamask.tokens,
    userAddress: getSelectedAddress(state),
    assetImages: state.metamask.assetImages,
  }
}

export default connect(mapStateToProps)(TokenList)
