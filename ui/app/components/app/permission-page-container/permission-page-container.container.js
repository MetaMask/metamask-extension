import { connect } from 'react-redux'
import PermissionPageContainer from './permission-page-container.component'
import { getMetaMaskIdentities } from '../../../selectors'

const mapStateToProps = (state, ownProps) => {
  const { selectedIdentities } = ownProps

  const allIdentities = getMetaMaskIdentities(state)
  const allIdentitiesSelected = Object.keys(selectedIdentities).length === Object.keys(allIdentities).length && selectedIdentities.length > 1

  return {
    allIdentitiesSelected,
  }
}

export default connect(mapStateToProps)(PermissionPageContainer)
