import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

type PageNotFoundProps = {
  /**
   * Optional copy under the description. Deep links use this for the
   * signed-but-unrecognized "update MetaMask" prompt.
   */
  extraDescription?: React.ReactNode;
};

/**
 * Screen shown when a wallet route does not exist.
 *
 * @param props - Component props
 * @param props.extraDescription - Optional copy under the description
 */
export const PageNotFound = ({
  extraDescription = null,
}: PageNotFoundProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      className="box-border w-full px-4 pt-[111px]"
      data-testid="parent-selector-deep-link-page"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        borderColor={BoxBorderColor.BorderMuted}
        borderWidth={1}
        paddingLeft={6}
        paddingRight={6}
        paddingTop={12}
        paddingBottom={8}
        className="box-border min-h-[592px] w-full max-w-[446px] rounded-md text-center"
        data-testid="page-not-found"
      >
        <img
          className="error-404-image"
          alt="Error 404: Page not found"
          src="./images/deep-link-error-404.png"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <Text
          asChild
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          className="mt-4 mb-4"
        >
          <h1>{t('deepLink_Error404Title')}</h1>
        </Text>
        <Box className="w-full pb-12" data-testid="deep-link-description">
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('deepLink_Error404Description')}
          </Text>
          {extraDescription ? <Box>{extraDescription}</Box> : null}
        </Box>
        <Box className="mt-12 w-full">
          <Button
            asChild
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
          >
            <a
              href={globalThis.platform.getExtensionURL('/')}
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
