import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PageContainerContent extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  render () {
    return (
      <div className="page-container__content">
        {this.props.children}
      </div>
    )
  }

}
