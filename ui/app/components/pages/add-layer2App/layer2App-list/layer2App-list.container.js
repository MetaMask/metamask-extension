import { connect } from 'react-redux'
import Layer2AppList from './layer2App-list.component'

const mapStateToProps = ({ metamask }) => {
  const { tokens } = metamask
  return {
    tokens,
  }
}

export default connect(mapStateToProps)(Layer2AppList)
