// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import type { SnapAccountRedirectProps } from '../snap-account-redirect';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import SnapAccountRedirectMessage from './snap-account-redirect-message';

const SnapAccountRedirectContent = ({
  url,
  snapName,
  isBlockedUrl,
  message,
  onSubmit,
}: SnapAccountRedirectProps) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  const learnMoreAboutBlockedUrls =
    'https://support.metamask.io/troubleshooting/deceptive-site-ahead-when-trying-to-connect-to-a-site/';

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      paddingTop={4}
    >
      <Box
        gap={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <Text
          data-testid="snap-account-redirect-content-title"
          textAlign={TextAlign.Center}
          variant={TextVariant.headingLg}
        >
          {t('snapAccountRedirectFinishSigningTitle')}
        </Text>
        {isBlockedUrl ? (
          <Box display={Display.Flex} paddingLeft={4} paddingRight={4}>
            <BannerAlert
              severity={BannerAlertSeverity.Danger}
              data-testid="snap-account-redirect-content-blocked-url-banner"
            >
              <Text>
                {t('snapUrlIsBlocked', [
                  <Button
                    variant={ButtonVariant.Link}
                    size={ButtonSize.Inherit}
                    onClick={() =>
                      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
                      // eslint-disable-next-line no-restricted-globals
                      global.platform.openTab({
                        url: learnMoreAboutBlockedUrls,
                      })
                    }
                    key={`snap-url-is-blocked-learn-more-button`}
                  >
                    {t('learnMore')}
                  </Button>,
                ])}
              </Text>
            </BannerAlert>
          </Box>
        ) : null}
        {/* TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31987 */}
        {/* eslint-disable-next-line no-negated-condition */}
        {!isBlockedUrl ? (
          <Text
            data-testid="snap-account-redirect-content-description"
            textAlign={TextAlign.Center}
            variant={TextVariant.bodyMd}
          >
            {t('snapAccountRedirectSiteDescription', [snapName])}
          </Text>
        ) : null}
        {(url.length > 0 || message.length > 0) && !isBlockedUrl ? (
          <SnapAccountRedirectMessage
            snapName={snapName}
            url={url}
            message={message}
            onSubmit={onSubmit}
          />
        ) : null}
      </Box>
    </Box>
  );
};

export default SnapAccountRedirectContent;
