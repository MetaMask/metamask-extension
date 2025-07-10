import React from 'react';
import {
  TextVariant,
  Display,
  AlignItems,
  FlexDirection,
  TextColor,
  IconColor,
  JustifyContent,
  BackgroundColor,
  BorderRadius,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  BannerAlert,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingError() {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  const errorStack = `
  Error: Objects are not valid as a React child (found: Error: Meow). If you meant to render a collection of children, use an array instead.
    at throwOnInvalidObjectType (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:41575:31)
    at reconcileChildFibers (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:42294:21)
    at reconcileChildren (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:44762:40)
    at updateHostComponent (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:45272:13)
    at beginWork (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:46439:28)
    at HTMLUnknownElement.callCallback (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:33733:30)
    at Object.invokeGuardedCallbackDev (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:33771:30)
    at invokeGuardedCallback (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:33822:41)
    at beginWork$1 (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:50328:21)
    at performUnitOfWork (chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/js-node_modules_q.573f8b2053228107add3.js:49383:24)
  `;

  return (
    <Box
      className="onboarding-error"
      data-testid="onboarding-error"
      marginTop={7}
      marginInline="auto"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        marginBottom={4}
        gap={2}
      >
        <Icon
          name={IconName.Danger}
          size={IconSize.Xl}
          color={IconColor.warningDefault}
        />
        <Text variant={TextVariant.headingMd}>{t('sentryErrorTitle')}</Text>
      </Box>

      <BannerAlert
        childrenWrapperProps={{ color: TextColor.inherit }}
        marginBottom={4}
      >
        {t('sentryErrorNote')}
      </BannerAlert>

      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        marginBottom={2}
      >
        <Text>{t('sentryErrorReport')}</Text>
        <Button
          onClick={() => {
            handleCopy(errorStack);
          }}
          startIconName={copied ? IconName.CopySuccess : IconName.Copy}
          variant={ButtonVariant.Link}
        >
          {copied ? t('copied') : t('copy')}
        </Button>
      </Box>

      <Box
        borderRadius={BorderRadius.LG}
        marginBottom={4}
        backgroundColor={BackgroundColor.errorMuted}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        paddingTop={4}
        paddingBottom={4}
        paddingInline={5}
        color={TextColor.errorDefault}
      >
        <Text
          variant={TextVariant.bodyXs}
          data-testid="error-page-error-message"
          color={TextColor.inherit}
        >
          {t('sentryErrorView', ['Root'])}
        </Text>
        <Text
          variant={TextVariant.bodyXs}
          data-testid="error-page-error-message"
          color={TextColor.inherit}
        >
          {t('sentryErrorError', ['Meow'])}
        </Text>
        <pre className="onboarding-error__stack">{errorStack}</pre>
      </Box>

      <Box display={Display.Flex} width={BlockSize.Full} gap={4}>
        <Button block size={ButtonSize.Lg} variant={ButtonVariant.Secondary}>
          {t('tryAgain')}
        </Button>
        <Button block size={ButtonSize.Lg} variant={ButtonVariant.Primary}>
          {t('sendReport')}
        </Button>
      </Box>
    </Box>
  );
}
