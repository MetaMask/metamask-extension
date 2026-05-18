import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import { Box } from '../../component-library';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import MetaFoxHorizontalLogo from './horizontal-logo';

export default class MetaFoxLogo extends PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    unsetIconHeight: PropTypes.bool,
    isOnboarding: PropTypes.bool,
    src: PropTypes.string,
    theme: PropTypes.string,
  };

  static defaultProps = {
    onClick: undefined,
    unsetIconHeight: false,
    isOnboarding: false,
    src: undefined,
    theme: undefined,
  };

  render() {
    const { onClick, unsetIconHeight, isOnboarding, src, theme } = this.props;

    const imageDimensions = unsetIconHeight ? {} : { height: 42, width: 42 };

    let renderHorizontalLogo = () => (
      <MetaFoxHorizontalLogo
        theme={theme}
        className={classnames({
          'app-header__metafox-logo--horizontal': !isOnboarding,
          'onboarding-app-header__metafox-logo--horizontal': isOnboarding,
        })}
      />
    );

    let imageSrc = './images/logo/metamask-fox.svg';

    if (src) {
      renderHorizontalLogo = () => (
        <span
          style={{
            backgroundImage: `url("${src}")`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            display: 'inline-block',
            ...imageDimensions,
          }}
          className={classnames({
            'app-header__metafox-logo--horizontal': !isOnboarding,
            'onboarding-app-header__metafox-logo--horizontal': isOnboarding,
          })}
          aria-hidden="true"
        />
      );

      imageSrc = src;
    }

    return (
      <Box
        as="button"
        onClick={onClick}
        className={classnames({
          'app-header__logo-container': !isOnboarding,
          'onboarding-app-header__logo-container': isOnboarding,
          'app-header__logo-container--clickable': Boolean(onClick),
        })}
        backgroundColor={BackgroundColor.transparent}
        data-testid="app-header-logo"
      >
        {renderHorizontalLogo()}

        <span
          style={{
            backgroundImage: `url("${imageSrc}")`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            display: 'inline-block',
            ...imageDimensions,
          }}
          className={classnames({
            'app-header__metafox-logo--icon': !isOnboarding,
            'onboarding-app-header__metafox-logo--icon': isOnboarding,
          })}
          aria-hidden="true"
        />
      </Box>
    );
  }
}
