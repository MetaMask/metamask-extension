import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

const Popover = ({ title, subtitle, children, onBack, onClose }) => (
  <div className="popover-container">
    <div className="popover-bg" onClick={onClose} />
    <div className="popover-wrap">
      <header className="popover-header">
        <div className="popover-header__title">
          <h2 title={title}>
            {
              onBack
                ? <i className="fas fa-chevron-left" onClick={onBack} />
                : null
            }
            {title}
          </h2>
          <i className="fas fa-times" onClick={onClose} />
        </div>
        <p className="popover-header__subtitle">{subtitle}</p>
      </header>
      <div className="popover-content">
        {children}
      </div>
    </div>
  </div>
)

Popover.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onBack: PropTypes.func,
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
