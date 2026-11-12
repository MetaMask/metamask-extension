import React from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useTheme } from '../../hooks/useTheme';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { ThemeType } from '../../../shared/constants/preferences';
import { QRCodeImage } from '../../components/app/deeplink-qr-code';
import { MarketingMomentTitle } from '../../components/ui/marketing-moment-title/marketing-moment-title';

const { getExtensionURL } = globalThis.platform;

type DeepLinkMobileShareProps = {
  /** The link to open on mobile, already stripped of `share=1`. */
  url: string;
};

/**
 * Hand-off screen for deep links that only MetaMask Mobile can open. Shows
 * a QR code for the link next to a brand accent panel; it never navigates to
 * the link's destination.
 *
 * @param props - Component props
 * @param props.url - The link to encode in the QR code
 */
export const DeepLinkMobileShare = ({ url }: DeepLinkMobileShareProps) => {
  const t = useI18nContext();
  const theme = useTheme();
  const [copied, handleCopy] = useCopyToClipboard();

  const panelTextClass =
    theme === ThemeType.light ? 'text-accent02-dark' : 'text-accent02-light';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      paddingHorizontal={4}
      className="box-border min-h-screen w-full py-12"
      data-testid="parent-selector-deep-link-page"
    >
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundSection}
        className="grid w-full max-w-[820px] grid-cols-1 overflow-hidden rounded-3xl md:grid-cols-2"
        data-testid="deep-link-mobile-share"
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Between}
          gap={10}
          padding={8}
          className={
            theme === ThemeType.light
              ? 'bg-accent02-light md:min-h-[420px]'
              : 'bg-accent02-dark md:min-h-[420px]'
          }
        >
          <img
            className="h-10 w-10"
            alt=""
            src="./images/logo/metamask-fox.svg"
          />
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <MarketingMomentTitle
              variant={TextVariant.DisplayLg}
              className={panelTextClass}
            >
              {t('deepLink_MobileShareTitle')}
            </MarketingMomentTitle>
            <Text
              variant={TextVariant.BodyMd}
              className={twMerge('max-w-[32ch] opacity-90', panelTextClass)}
            >
              {t('deepLink_MobileShareDescription')}
            </Text>
          </Box>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          gap={4}
          padding={8}
          className="min-w-0"
        >
          <Box className="self-center">
            <QRCodeImage data={url} />
          </Box>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
            backgroundColor={BoxBackgroundColor.BackgroundDefault}
            className="min-w-0 rounded-lg py-2 pl-3 pr-1"
          >
            <Text
              asChild
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="min-w-0 flex-1 truncate"
            >
              <span title={url} data-testid="deep-link-mobile-share-url">
                {url}
              </span>
            </Text>
            <ButtonIcon
              iconName={copied ? IconName.CopySuccess : IconName.Copy}
              size={ButtonIconSize.Sm}
              ariaLabel={copied ? t('copiedExclamation') : t('copyToClipboard')}
              onClick={() => handleCopy(url)}
              data-testid="deep-link-mobile-share-copy"
            />
            <span className="sr-only" role="status">
              {copied ? t('copiedExclamation') : null}
            </span>
          </Box>
          <Button
            asChild
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            isFullWidth
          >
            <a
              href={getExtensionURL('/')}
              data-testid="deep-link-continue-button"
            >
              {t('deepLink_GoToTheHomePageButton')}
            </a>
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
