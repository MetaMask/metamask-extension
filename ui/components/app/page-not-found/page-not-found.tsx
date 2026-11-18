import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { FullPageCard } from '../full-page-card/full-page-card';

type PageNotFoundProps = {
  /**
   * Optional copy under the description. Deep links use this for the
   * signed-but-unrecognized "update MetaMask" prompt.
   */
  extraDescription?: React.ReactNode;
  pageTestId?: string;
};

/**
 * Screen shown when a wallet route does not exist.
 *
 * @param props - Component props
 * @param props.extraDescription - Optional copy under the description
 * @param props.pageTestId - Test id for the outer page wrapper
 */
export const PageNotFound = ({
  extraDescription = null,
  pageTestId,
}: PageNotFoundProps) => {
  const t = useI18nContext();

  return (
    <FullPageCard pageTestId={pageTestId} cardTestId="page-not-found">
      <img
        className="error-404-image h-auto max-w-full"
        alt="Error 404: Page not found"
        src="./images/deep-link-error-404.png"
      />
      <Text
        asChild
        variant={TextVariant.HeadingLg}
        fontWeight={FontWeight.Bold}
        className="my-4"
      >
        <h1>{t('deepLink_Error404Title')}</h1>
      </Text>
      <Box
        paddingBottom={12}
        className="w-full"
        data-testid="deep-link-description"
      >
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('deepLink_Error404Description')}
        </Text>
        {extraDescription ? <Box>{extraDescription}</Box> : null}
      </Box>
      <Box marginTop={12} className="w-full">
        <Button
          asChild
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full hover:text-primary-inverse"
        >
          <a
            href={globalThis.platform.getExtensionURL('/')}
            data-testid="deep-link-continue-button"
          >
            {t('deepLink_GoToTheHomePageButton')}
          </a>
        </Button>
      </Box>
    </FullPageCard>
  );
};
