import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class PageContainerContent extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  render() {
    return <div className="page-container__content">{this.props.children}</div>;
  }
}
