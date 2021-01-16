import { connect } from 'react-redux'
import NetworkDisplay from './network-display.component'

const mapStateToProps = ({ metamask: { provider } }) => {
  return {
    provider,
  }
}

export default connect(mapStateToProps)(NetworkDisplay)
