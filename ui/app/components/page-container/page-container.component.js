import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PageContainer extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  render () {
    return (
      <div className="page-container">
        {this.props.children}
      </div>
    )
  }

}
