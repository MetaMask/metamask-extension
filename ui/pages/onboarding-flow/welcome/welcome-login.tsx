// import EventEmitter from 'events';
import React from 'react';
import classnames from 'classnames';
// import Mascot from '../../../components/ui/mascot';
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
import ExpandableInputButton from '../../../components/ui/expandable-input-button';

type WelcomeLoginProps = {
  onCreate: () => void;
  onImport: () => void;
};

export default function WelcomeLogin({
  onCreate,
  onImport,
}: WelcomeLoginProps) {
  const t = useI18nContext();
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
          {/* {renderMascot()} */}
          <img
            src="./images/cryptobridge/logo-3d.png"
            width="308"
            height="240"
          />
        </Box>
        <Text
          marginInline={5}
          textAlign={TextAlign.Center}
          as="h2"
          className="welcome-login__title"
          data-testid="onboarding-welcome"
        >
          {t('welcomeTitle')}
        </Text>
        <Text
          marginInline={5}
          textAlign={TextAlign.Center}
          as="h3"
          className="welcome-login__description"
          data-testid="onboarding-desc"
        >
          {t('welcomeDescription')}
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

      <ExpandableInputButton
        buttonText={t('referralCode')}
        inputPlaceholder={t('referralCodeInputPlace')}
        onInputChange={(value: string) => console.log(value)}
        onButtonClick={() => console.log('Button clicked')}
      />

      <Box className="welcome-login__footer">
        <Box className="welcome-login__footer__text" as="span">
          {t('footerAgreementDesc')}
        </Box>
        <Box
          type="link"
          as="a"
          href="https://www.crypto-bridge.co/wp-content/uploads/2025/06/ENJP-CryptoBridge-Terms-Conditions-2025-06-12.pdf"
          target="_blank"
          className="welcome-login__footer__link"
        >
          {`${t('termsConditions')} & `}
        </Box>
        <Box
          type="link"
          as="a"
          href="https://www.crypto-bridge.co/wp-content/uploads/2025/06/ENJP-CryptoBridge-Privacy-Policy-2025-06-12.pdf"
          target="_blank"
          className="welcome-login__footer__link"
        >
          {t('privacyPolicy')}
        </Box>
      </Box>
    </Box>
  );
}
