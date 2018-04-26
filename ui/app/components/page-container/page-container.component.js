import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PageContainer extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  render () {
    console.log(`QQQQQQQQQQQQQQQQQ this.props.children`, this.props.children);
    return (
      <div className="page-container">
        {this.props.children}
      </div>
    );
  }

}
