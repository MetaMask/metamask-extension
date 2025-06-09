import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

export default class MenuDroppoComponent extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    innerStyle: PropTypes.object,
    children: PropTypes.node.isRequired,
    onClickOutside: PropTypes.func,
    containerClassName: PropTypes.string,
    zIndex: PropTypes.number,
    style: PropTypes.object.isRequired,
    useCssTransition: PropTypes.bool,
    speed: PropTypes.string,
  };

  renderPrimary() {
    const { isOpen } = this.props;
    if (!isOpen) {
      return null;
    }

    const innerStyle = this.props.innerStyle || {};

    return (
      <div
        className="menu-droppo"
        key="menu-droppo-drawer"
        data-testid="menu-droppo"
        style={innerStyle}
      >
        {this.props.children}
      </div>
    );
  }

  globalClickOccurred = (event) => {
    const { target } = event;
    // eslint-disable-next-line react/no-find-dom-node
    const container = findDOMNode(this);

    if (
      this.props.isOpen &&
      target !== container &&
      !this.container.contains(event.target)
    ) {
      this.props.onClickOutside?.(event);
    }
  };

  componentDidMount() {
    if (this && document.body) {
      document.body.addEventListener('click', this.globalClickOccurred);
      // eslint-disable-next-line react/no-find-dom-node
      const container = findDOMNode(this);
      this.container = container;
    }
  }

  componentWillUnmount() {
    if (this && document.body) {
      document.body.removeEventListener('click', this.globalClickOccurred);
    }
  }

  render() {
    const { containerClassName = '', style } = this.props;
    const speed = this.props.speed || '300ms';
    const { useCssTransition } = this.props;
    const zIndex = 'zIndex' in this.props ? this.props.zIndex : 0;

    const baseStyle = {
      position: 'fixed',
      ...style,
      zIndex,
    };

    return (
      <div
        style={baseStyle}
        className={`menu-droppo-container ${containerClassName}`}
        data-testid={containerClassName}
      >
        <style>
          {`
          .menu-droppo-enter {
            transition: transform ${speed} ease-in-out;
            transform: translateY(-200%);
          }

          .menu-droppo-enter.menu-droppo-enter-active {
            transition: transform ${speed} ease-in-out;
            transform: translateY(0%);
          }

          .menu-droppo-leave {
            transition: transform ${speed} ease-in-out;
            transform: translateY(0%);
          }

          .menu-droppo-leave.menu-droppo-leave-active {
            transition: transform ${speed} ease-in-out;
            transform: translateY(-200%);
          }
        `}
        </style>
        {useCssTransition ? (
          <ReactCSSTransitionGroup
            className="css-transition-group"
            transitionName="menu-droppo"
            transitionEnterTimeout={parseInt(speed, 10)}
            transitionLeaveTimeout={parseInt(speed, 10)}
          >
            {this.renderPrimary()}
          </ReactCSSTransitionGroup>
        ) : (
          this.renderPrimary()
        )}
      </div>
    );
  }
}
