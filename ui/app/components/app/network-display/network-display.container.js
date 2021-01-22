import { connect } from 'react-redux'
import NetworkDisplay from './network-display.component'

const mapStateToProps = ({
  metamask: {
    provider: { nickname, type },
  },
}) => {
  return {
    networkNickname: nickname,
    networkType: type,
  }
}

export default connect(mapStateToProps)(NetworkDisplay)
