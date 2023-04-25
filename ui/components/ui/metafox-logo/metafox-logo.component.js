import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import MetaFoxHorizontalLogo from './horizontal-logo';

export default class MetaFoxLogo extends PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    unsetIconHeight: PropTypes.bool,
    isOnboarding: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
    src: PropTypes.string,
    ///: END:ONLY_INCLUDE_IN
  };

  static defaultProps = {
    onClick: undefined,
  };

  render() {
    const {
      onClick,
      unsetIconHeight,
      isOnboarding,
      ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
      src,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
    const iconProps = unsetIconHeight ? {} : { height: 42, width: 42 };

    let renderHorizontalLogo = () => (
      <MetaFoxHorizontalLogo
        className={classnames({
          'app-header__metafox-logo--horizontal': !isOnboarding,
          'onboarding-app-header__metafox-logo--horizontal': isOnboarding,
        })}
      />
    );

    let imageSrc = './images/logo/metamask-fox.svg';

    ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
    if (src) {
      renderHorizontalLogo = () => (
        <img
          {...iconProps}
          src={src}
          className={classnames({
            'app-header__metafox-logo--horizontal': !isOnboarding,
            'onboarding-app-header__metafox-logo--horizontal': isOnboarding,
          })}
          alt=""
        />
      );

      imageSrc = src;
    }
    ///: END:ONLY_INCLUDE_IN

    return (
      <div
        onClick={onClick}
        className={classnames({
          'app-header__logo-container': !isOnboarding,
          'onboarding-app-header__logo-container': isOnboarding,
          'app-header__logo-container--clickable': Boolean(onClick),
        })}
        data-testid="app-header-logo"
      >
        {renderHorizontalLogo()}

        <img
          {...iconProps}
          src={imageSrc}
          className={classnames({
            'app-header__metafox-logo--icon': !isOnboarding,
            'onboarding-app-header__metafox-logo--icon': isOnboarding,
          })}
          alt=""
        />
      </div>
    );
  }
}
