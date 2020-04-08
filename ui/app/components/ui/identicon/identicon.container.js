import { connect } from 'react-redux'
import Identicon from './identicon.component'

import { isEbakusNetwork } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  const { metamask: { useBlockie } } = state

  return {
    useBlockie,
    isEbakusNetwork: isEbakusNetwork(state),
  }
}

export default connect(mapStateToProps)(Identicon)
