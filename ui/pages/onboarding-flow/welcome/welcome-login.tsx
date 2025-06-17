import EventEmitter from 'events';
import React, { useState } from 'react';
import classnames from 'classnames';
import Mascot from '../../../components/ui/mascot';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isFlask, isBeta } from '../../../helpers/utils/build-types';

type WelcomeLoginProps = {
  onCreate: () => void;
  onImport: () => void;
};

export default function WelcomeLogin({
  onCreate,
  onImport,
}: WelcomeLoginProps) {
  const t = useI18nContext();
  const [eventEmitter] = useState(new EventEmitter());

  const renderMascot = () => {
    if (isFlask()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="178" height="178" />
      );
    }
    if (isBeta()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="178" height="178" />
      );
    }
    return (
      <Mascot animationEventEmitter={eventEmitter} width="268" height="268" />
    );
  };
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      gap={4}
      marginInline="auto"
      marginTop={2}
      padding={6}
      className="welcome-login"
      data-testid="get-started"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        className="welcome-login__content"
      >
        <Box
          className={classnames('welcome-login__mascot', {
            'welcome-login__mascot--image': isFlask() || isBeta(),
          })}
        >
          {renderMascot()}
        </Box>

        <Text
          marginInline={5}
          textAlign={TextAlign.Center}
          as="h2"
          className="welcome-login__title"
          data-testid="onboarding-welcome"
        >
          {t('welcomeToMetaMask')}!
        </Text>
      </Box>

      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
        <ButtonBase
          data-testid="onboarding-create-wallet"
          width={BlockSize.Full}
          size={ButtonBaseSize.Lg}
          className="welcome-login__create-button"
          onClick={onCreate}
        >
          {t('onboardingCreateWallet')}
        </ButtonBase>
        <ButtonBase
          data-testid="onboarding-import-wallet"
          width={BlockSize.Full}
          size={ButtonBaseSize.Lg}
          backgroundColor={BackgroundColor.transparent}
          className="welcome-login__import-button"
          onClick={onImport}
        >
          {t('onboardingImportWallet')}
        </ButtonBase>
      </Box>
    </Box>
  );
}
