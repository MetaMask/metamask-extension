import EventEmitter from 'events';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import classnames from 'classnames';
import Mascot from '../../../components/ui/mascot';
import {
  ButtonBase,
  ButtonBaseSize,
  Text,
} from '../../../components/component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isFlask, isBeta } from '../../../helpers/utils/build-types';
import LoginOptions from './login-options';
import { LoginOptionType, LoginType } from './types';

export default function WelcomeLogin({
  onLogin,
}: {
  onLogin: (loginType: LoginType, loginOption: string) => void;
}) {
  const t = useI18nContext();
  const [eventEmitter] = useState(new EventEmitter());
  const [loginOption, setLoginOption] = useState<LoginOptionType | null>(null);

  const renderMascot = () => {
    if (isFlask()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="173" height="173" />
      );
    }
    if (isBeta()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="173" height="173" />
      );
    }
    return (
      <Mascot
        animationEventEmitter={eventEmitter}
        followMouse={false}
        width="268"
        height="268"
      />
    );
  };

  const handleLogin = (loginType: LoginType) => {
    if (!loginOption) {
      return;
    }
    setLoginOption(null);
    onLogin(loginType, loginOption);
  };

  return (
    <div className="welcome-login" data-testid="get-started">
      <div className="welcome-login__content">
        <div
          className={classnames('welcome-login__mascot', {
            'welcome-login__mascot--image': isFlask() || isBeta(),
          })}
        >
          {renderMascot()}
        </div>

        <Text
          as="h2"
          className="welcome-login__title"
          data-testid="onboarding-welcome"
        >
          {t('welcomeToMetaMask')}!
        </Text>
      </div>

      <div className="welcome-login__footer">
        <ul className="welcome-login__buttons">
          <li>
            <ButtonBase
              width={BlockSize.Full}
              size={ButtonBaseSize.Lg}
              className="welcome-login__create-button"
              onClick={() => {
                setLoginOption('new');
              }}
            >
              {t('onboardingCreateWallet')}
            </ButtonBase>
          </li>
          <li>
            <ButtonBase
              width={BlockSize.Full}
              size={ButtonBaseSize.Lg}
              className="welcome-login__import-button"
              onClick={() => {
                setLoginOption('existing');
              }}
            >
              {t('onboardingImportWallet')}
            </ButtonBase>
          </li>
        </ul>
      </div>
      {loginOption && (
        <LoginOptions
          loginOption={loginOption}
          onClose={() => {
            setLoginOption(null);
          }}
          handleLogin={handleLogin}
        />
      )}
    </div>
  );
}

WelcomeLogin.propTypes = {
  onLogin: PropTypes.func.isRequired,
};
