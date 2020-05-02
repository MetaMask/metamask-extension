import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { getSelectedAddress } from '../../../selectors'
import TokenList from './token-list.component'

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    tokens: state.metamask.tokens,
    userAddress: getSelectedAddress(state),
    assetImages: state.metamask.assetImages,
  }
}

const TokenListContainer = connect(mapStateToProps)(TokenList)

TokenListContainer.propTypes = {
  onTokenClick: PropTypes.func.isRequired,
}

export default TokenListContainer
