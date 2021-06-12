import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { MILLISECOND } from '../../../../shared/constants/time';

class Alert extends Component {
  state = {
    visible: false,
    msg: false,
    className: '',
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.props.visible && nextProps.visible) {
      this.animateIn(nextProps.msg);
    } else if (this.props.visible && !nextProps.visible) {
      this.animateOut();
    }
  }

  animateIn(msg) {
    this.setState({
      msg,
      visible: true,
      className: 'visible',
    });
  }

  animateOut() {
    this.setState({
      msg: null,
      className: 'hidden',
    });

    setTimeout((_) => {
      this.setState({ visible: false });
    }, MILLISECOND * 500);
  }

  render() {
    if (this.state.visible) {
      return (
        <div className={classnames('global-alert', this.state.className)}>
          <a className="msg">{this.state.msg}</a>
        </div>
      );
    }
    return null;
  }
}

Alert.propTypes = {
  visible: PropTypes.bool.isRequired,
  msg: PropTypes.string /* eslint-disable-line react/no-unused-prop-types */,
};
export default Alert;
