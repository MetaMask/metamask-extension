import { connect } from 'react-redux'
import { getSendFromObject } from '../../send.selectors.js'
import SendFromRow from './send-from-row.component'

function mapStateToProps (state) {
  return {
    from: getSendFromObject(state),
  }
}

export default connect(mapStateToProps)(SendFromRow)
