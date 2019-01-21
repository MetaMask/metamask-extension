import { connect } from 'react-redux'
import Layer2AppList from './layer2App-list.component'

const mapStateToProps = ({ metamask }) => {
  const { layer2Apps } = metamask
  return {
    layer2Apps,
  }
}

export default connect(mapStateToProps)(Layer2AppList)
