import { connect } from 'react-redux'
import AddPlugin from './add-plugin.component'

const mapStateToProps = ({ metamask }) => {
  const { identities, plugins } = metamask
  return {
    identities,
    plugins,
  }
}

const mapDispatchToProps = dispatch => {
  return {
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddPlugin)
