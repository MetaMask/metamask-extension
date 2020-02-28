import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { PureComponent } from 'react'

export default class PopOverRoot extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
  }

  rootNode = document.getElementById('popover-content')

  instanceNode = document.createElement('div')

  componentDidMount () {
    this.rootNode.appendChild(this.instanceNode)
  }

  componentWillUnmount () {
    this.rootNode.removeChild(this.instanceNode)
  }

  render () {
    return ReactDOM.createPortal(this.props.children, this.instanceNode)
  }
}
