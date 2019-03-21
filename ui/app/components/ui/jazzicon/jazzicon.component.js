import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import isNode from 'detect-node'
import { findDOMNode } from 'react-dom'
import jazzicon from 'jazzicon'
import iconFactoryGenerator from '../../../../lib/icon-factory'
const iconFactory = iconFactoryGenerator(jazzicon)

/**
 * Wrapper around the jazzicon library to return a React component, as the library returns an
 * HTMLDivElement which needs to be appended.
 */
export default class Jazzicon extends PureComponent {
  static propTypes = {
    address: PropTypes.string.isRequired,
    className: PropTypes.string,
    diameter: PropTypes.number,
    style: PropTypes.object,
  }

  static defaultProps = {
    diameter: 46,
  }

  componentDidMount () {
    if (!isNode) {
      this.appendJazzicon()
    }
  }

  componentDidUpdate (prevProps) {
    const { address: prevAddress } = prevProps
    const { address } = this.props

    if (!isNode && address !== prevAddress) {
      this.removeExistingChildren()
      this.appendJazzicon()
    }
  }

  removeExistingChildren () {
    // eslint-disable-next-line react/no-find-dom-node
    const container = findDOMNode(this)
    const { children } = container

    for (let i = 0; i < children.length; i++) {
      container.removeChild(children[i])
    }
  }

  appendJazzicon () {
    // eslint-disable-next-line react/no-find-dom-node
    const container = findDOMNode(this)
    const { address, diameter } = this.props
    const image = iconFactory.iconForAddress(address, diameter)
    container.appendChild(image)
  }

  render () {
    const { className, style } = this.props

    return (
      <div
        className={className}
        style={style}
      />
    )
  }
}
