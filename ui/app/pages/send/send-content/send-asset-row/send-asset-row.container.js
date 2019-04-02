import { connect } from 'react-redux'
import SendAssetRow from './send-asset-row.component'

function mapStateToProps (state) {
  return {
    tokens: state.metamask.tokens,
  }
}

export default connect(mapStateToProps)(SendAssetRow)
