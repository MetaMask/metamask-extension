import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class InfoBox extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    onClose: PropTypes.func,
    title: PropTypes.string,
    description: PropTypes.string,
  };

  state = {
    isShowing: true,
  };

  handleClose() {
    const { onClose } = this.props;

    if (onClose) {
      onClose();
    } else {
      this.setState({ isShowing: false });
    }
  }

  render() {
    const { title, description } = this.props;

    return this.state.isShowing ? (
      <div className="info-box">
        <div className="info-box__close" onClick={() => this.handleClose()} />
        <div className="info-box__title">{title}</div>
        <div className="info-box__description">{description}</div>
      </div>
    ) : null;
  }
}
