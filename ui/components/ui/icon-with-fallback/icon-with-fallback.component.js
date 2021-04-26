import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class IconWithFallback extends PureComponent {
  static propTypes = {
    icon: PropTypes.string,
    name: PropTypes.string,
    size: PropTypes.number,
    className: PropTypes.string,
    fallbackClassName: PropTypes.string,
  };

  static defaultProps = {
    name: '',
    icon: null,
  };

  state = {
    iconError: false,
  };

  render() {
    const { icon, name, size, className, fallbackClassName } = this.props;
    const style = size ? { height: `${size}px`, width: `${size}px` } : {};

    return !this.state.iconError && icon ? (
      <img
        onError={() => this.setState({ iconError: true })}
        src={icon}
        style={style}
        className={className}
        alt=""
      />
    ) : (
      <i
        className={classnames(
          'icon-with-fallback__fallback',
          fallbackClassName,
        )}
      >
        {name.length ? name.charAt(0).toUpperCase() : ''}
      </i>
    );
  }
}
