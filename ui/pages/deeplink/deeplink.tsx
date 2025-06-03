import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../components/component-library/button';
import { parse } from '../../../shared/lib/deeplinks/parse';
import { routes } from '../../../shared/lib/deeplinks/routes';
import { DEEP_LINK_HOST } from '../../../shared/lib/deeplinks/constants';
import log from 'loglevel';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library/text/text';
import { Box } from '../../components/component-library/box/box';
import { BaseUrl } from '../../../shared/constants/urls';
import { Container } from '../../components/component-library/container/container';
import { ContainerMaxWidth, Label } from '../../components/component-library';
import { Checkbox } from '../../components/component-library/checkbox/checkbox';

const { getExtensionURL } = globalThis.platform;

function handleOnClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
  e.preventDefault();
  if (window.history.length > 1) {
    // If there is a history, go back to the previous page
    // TODO: this has so many ways it won't work and leave the user frustrated. Revisit this idea.
    window.history.back();
  } else {
    // If there is no history, redirect to https://metamask.io/
    window.location.href = BaseUrl.MetaMask;
  }
}

export const DeepLink = () => {
  const location = useLocation();
  const t = useI18nContext();
  const [route, setRoute] = useState<null | {
    href: string;
    title: string;
    signed: boolean;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlStr = params.get('u');
    if (!urlStr) {
      setError('No url to navigate to was provided.');
      return;
    }

    async function pp(urlStr: string) {
      const fullUrlStr = `https://${DEEP_LINK_HOST}${urlStr}`;
      try {
        const parsed = await parse(fullUrlStr);
        if (parsed) {
          const { url, destination, signed } = parsed;
          const { path, query } = destination;
          const href = getExtensionURL(path, query.toString() ?? null);
          const title =
            routes.get(url.pathname)!.getTitle(url.searchParams) ?? '';
          setRoute({ href, title, signed });
        } else {
          setRoute(null);
          setError(
            'Provided URL is not a valid MetaMask deeplink or is malformed.',
          );
        }
      } catch (e) {
        log.error('Error parsing deeplink:', e);
        setError('An error occurred while processing the deeplink.');
        setRoute(null);
      }
    }
    pp(urlStr);
  }, [location.search]);

  return (
    <Container maxWidth={ContainerMaxWidth.Lg} textAlign={TextAlign.Center}>
      <>
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <img className="loading-logo" src="./images/logo/metamask-fox.svg" />
          {route ? (
            ''
          ) : (
            <img
              className="loading-spinner"
              src="./images/spinner.gif"
              alt=""
            />
          )}
        </Box>
        {error ? (
          <Box className="error">
            <Text>{error}</Text>
          </Box>
        ) : route ? (
          <Box padding={4}>
            <Box margin={4}>
              <Text margin={4}>
                A previous action wants to navigate to a page within the
                MetaMask extension.
              </Text>
              {!route.signed ? (
                <Text margin={4}>
                  You should only continue if you trust the source of this link.
                </Text>
              ) : (
                ''
              )}
            </Box>
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              gap={2}
              margin={4}
            >
              <Checkbox
                id="dont-remind-me-checkbox"
                isChecked={hasChecked}
                onClick={() => setHasChecked((prevValue) => !prevValue)}
              ></Checkbox>
              <Label
                htmlFor="dont-remind-me-checkbox"
                fontWeight={FontWeight.Normal}
                variant={TextVariant.bodySm}
              >
                Don't remind me again
              </Label>
            </Box>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              gap={4}
              padding={4}
            >
              <Button
                size={ButtonSize.Lg}
                variant={ButtonVariant.Secondary}
                onClick={handleOnClick}
              >
                {t('cancel')}
              </Button>

              <Button
                variant={ButtonVariant.Primary}
                href={route.href}
                size={ButtonSize.Lg}
              >
                {t(route.title) ?? route.title}
              </Button>
            </Box>
          </Box>
        ) : (
          ''
        )}
      </>
    </Container>
  );
};
