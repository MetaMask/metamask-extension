import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../components/component-library/button';
import { Box } from '../../components/component-library/box/box';
import { Text } from '../../components/component-library/text/text';
import {
  BlockSize,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DeepLinkCard } from './deep-link-card';

type DeepLinkNotFoundProps = {
  extraDescription?: React.ReactNode;
};

/**
 * The deep-link "this page doesn't exist" screen.
 * Unknown wallet routes render this directly and leave the bad URL in place.
 * @param options0
 * @param options0.extraDescription
 */
export const DeepLinkNotFound = ({
  extraDescription = null,
}: DeepLinkNotFoundProps) => {
  const t = useI18nContext();
  const homeHref = globalThis.platform.getExtensionURL('/');

  return (
    <DeepLinkCard>
      <img
        className="error-404-image"
        alt="Error 404: Page not found"
        src="./images/deep-link-error-404.png"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <Text
        as="h1"
        variant={TextVariant.headingLg}
        fontWeight={FontWeight.Bold}
        marginTop={4}
        marginBottom={4}
      >
        {t('deepLink_Error404Title')}
      </Text>
      <Box
        as="div"
        data-testid="deep-link-description"
        paddingBottom={12}
        height={BlockSize.Full}
      >
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {t('deepLink_Error404Description')}
        </Text>
        {extraDescription ? <Box>{extraDescription}</Box> : null}
      </Box>
      <Box width={BlockSize.Full} marginTop={12}>
        <Button
          width={BlockSize.Full}
          variant={ButtonVariant.Primary}
          href={homeHref}
          size={ButtonSize.Lg}
          data-testid="deep-link-continue-button"
        >
          {t('deepLink_GoToTheHomePageButton')}
        </Button>
      </Box>
    </DeepLinkCard>
  );
};
