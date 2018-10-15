import { connect } from 'react-redux'
import ConfirmAddLayer2App from './confirm-add-layer2App.component'

const { addLayer2Apps, clearPendingLayer2Apps } = require('../../../actions')

const mapStateToProps = ({ metamask }) => {
  const { pendingLayer2Apps } = metamask
  return {
    pendingLayer2Apps,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addLayer2Apps: layer2Apps => dispatch(addLayer2Apps(layer2Apps)),
    clearPendingLayer2Apps: () => dispatch(clearPendingLayer2Apps()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmAddLayer2App)
