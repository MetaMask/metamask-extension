import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
} from '../../components/component-library/button';
import { parse } from '../../../shared/lib/deeplinks/parse';
import { routes } from '../../../shared/lib/deeplinks/routes';
import { DEEP_LINK_HOST } from '../../../shared/lib/deeplinks/constants';
import log from 'loglevel';

const { getExtensionURL } = globalThis.platform;

export const DeepLink = () => {
  const history = useHistory();
  const location = useLocation();
  const [route, setRoute] = useState<null | {
    href: string;
    title: string;
    signed: boolean;
  }>(null);
  const [error, setError] = useState<string | null>(null);
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
          debugger;
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
    <div className="deeplink__router">
      {error ? (
        <p className="error">{error}</p>
      ) : route ? (
        <div>
          <p>
            A previous action wants to navigate to a page within the MetaMask
            extension.
          </p>
          <p>You should only continue if you trust the source of this link.</p>
          <p>
            Signed and Verified link? <span>{route.signed ? 'Yes' : 'No'}</span>
            .
          </p>
          <Button
            variant={ButtonVariant.Primary}
            href={route.href}
            onClick={() => {
              history.push(route); // Update the history to reflect the new path
            }}
          >
            {route.title}
          </Button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};
