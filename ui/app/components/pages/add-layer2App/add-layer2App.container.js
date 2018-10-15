import { connect } from 'react-redux'
import AddLayer2App from './add-layer2App.component'

const { setPendingLayer2Apps, clearPendingLayer2Apps } = require('../../../actions')

const mapStateToProps = ({ metamask }) => {
  const { identities, layer2Apps, pendingLayer2Apps } = metamask
  return {
    identities,
    layer2Apps,
    pendingLayer2Apps,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setPendingLayer2Apps: layer2Apps => dispatch(setPendingLayer2Apps(layer2Apps)),
    clearPendingLayer2Apps: () => dispatch(clearPendingLayer2Apps()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddLayer2App)
