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
import { SnapAccountRedirectProps } from '../snap-account-redirect';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import SnapAccountRedirectMessage from './snap-account-redirect-message';

const SnapAccountRedirectContent = ({
  url,
  snapName,
  isBlockedUrl,
  message,
}: SnapAccountRedirectProps) => {
  const t = useI18nContext();
  const learnMoreAboutBlockedUrls =
    'https://support.metamask.io/hc/en-us/articles/4428045875483--Deceptive-site-ahead-when-trying-to-connect-to-a-site';

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
        {isBlockedUrl === false ? (
          <Text
            data-testid="snap-account-redirect-content-description"
            textAlign={TextAlign.Center}
            variant={TextVariant.bodyMd}
          >
            {t('snapAccountRedirectSiteDescription', [snapName])}
          </Text>
        ) : null}
        {(url.length > 0 || message.length > 0) && isBlockedUrl === false ? (
          <SnapAccountRedirectMessage
            snapName={snapName}
            url={url}
            message={message}
          />
        ) : null}
      </Box>
    </Box>
  );
};

export default SnapAccountRedirectContent;
