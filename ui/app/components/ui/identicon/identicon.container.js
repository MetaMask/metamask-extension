import { connect } from 'react-redux'
import Identicon from './identicon.component'

const mapStateToProps = (state) => {
  const {
    metamask: { useBlockie, trustedTokenMap },
  } = state

  return {
    trustedTokenMap,
    useBlockie,
  }
}

export default connect(mapStateToProps)(Identicon)
