import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class ButtonGroup extends PureComponent {
  static propTypes = {
    defaultActiveButtonIndex: PropTypes.number,
    noButtonActiveByDefault: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.array,
    className: PropTypes.string,
    style: PropTypes.object,
    newActiveButtonIndex: PropTypes.number,
    variant: PropTypes.oneOf(['radiogroup', 'default']),
  };

  static defaultProps = {
    className: 'button-group',
    defaultActiveButtonIndex: 0,
    variant: 'default',
  };

  state = {
    activeButtonIndex: this.props.noButtonActiveByDefault
      ? null
      : this.props.defaultActiveButtonIndex,
  };

  componentDidUpdate(_, prevState) {
    // Provides an API for dynamically updating the activeButtonIndex
    if (
      typeof this.props.newActiveButtonIndex === 'number' &&
      prevState.activeButtonIndex !== this.props.newActiveButtonIndex
    ) {
      this.setState({ activeButtonIndex: this.props.newActiveButtonIndex });
    }
  }

  handleButtonClick(activeButtonIndex) {
    this.setState({ activeButtonIndex });
  }

  renderButtons() {
    const { children, disabled, variant } = this.props;

    return React.Children.map(children, (child, index) => {
      return (
        child && (
          <button
            role={variant === 'radiogroup' ? 'radio' : undefined}
            aria-checked={index === this.state.activeButtonIndex}
            className={classnames(
              'button-group__button',
              child.props.className,
              {
                'radio-button': variant === 'radiogroup',
                'button-group__button--active':
                  index === this.state.activeButtonIndex,
                'radio-button--active':
                  variant === 'radiogroup' &&
                  index === this.state.activeButtonIndex,
              },
            )}
            onClick={() => {
              this.handleButtonClick(index);
              child.props.onClick?.();
            }}
            disabled={disabled || child.props.disabled}
            key={index}
          >
            {child.props.children}
          </button>
        )
      );
    });
  }

  render() {
    const { className, style, variant } = this.props;

    return (
      <div
        className={classnames(className, {
          'radio-button-group': variant === 'radiogroup',
        })}
        role={variant === 'radiogroup' ? 'radiogroup' : undefined}
        style={style}
      >
        {this.renderButtons()}
      </div>
    );
  }
}
