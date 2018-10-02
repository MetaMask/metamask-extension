import { connect } from 'react-redux'
import TokenSearch from './token-search.component'

const { clearPendingTokens } = require('../../../../../ui/app/actions')

const mapStateToProps = ({ metamask }) => {
  const { network } = metamask
  return {
    network,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    clearPendingTokens: () => dispatch(clearPendingTokens()),
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(TokenSearch)
