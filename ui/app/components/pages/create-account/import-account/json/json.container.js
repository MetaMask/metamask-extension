import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import actions from '../../../../../actions'
import JsonImportSubview from './json.component'


export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(JsonImportSubview)


function mapStateToProps (state) {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(state.metamask.accounts)[0],
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(actions.goHome()),
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    importNewJsonAccount: options => dispatch(actions.importNewAccount('JSON File', options)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
  }
}
