import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import PopoverHeader from './popover.header.component'

const Popover = ({ title, children, onClose }) => (
  <div className="popover-container">
    <div className="popover-bg" onClick={onClose} />
    <div className="popover-wrap">
      <PopoverHeader title={title} onClose={onClose} />
      <div className="popover-content">
        {children}
      </div>
    </div>
  </div>
)

Popover.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default class PopoverPortal extends PureComponent {
  static propTypes = Popover.propTypes

  rootNode = document.getElementById('popover-content')

  instanceNode = document.createElement('div')

  componentDidMount () {
    if (!this.rootNode) {
      return
    }

    this.rootNode.appendChild(this.instanceNode)
  }

  componentWillUnmount () {
    if (!this.rootNode) {
      return
    }

    this.rootNode.removeChild(this.instanceNode)
  }

  render () {
    const children = <Popover {...this.props} />
    return this.rootNode
      ? ReactDOM.createPortal(children, this.instanceNode)
      : children
  }
}
