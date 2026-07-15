import React, { useCallback } from 'react';
import { isSnapId } from '@metamask/snaps-utils';
import Button from '../../ui/button';
import { AvatarFavicon, AvatarFaviconSize, IconSize } from '../../component-library';
import { stripHttpsSchemeWithoutPort } from '../../../helpers/utils/util';
import SiteOrigin from '../../ui/site-origin';
import { SnapIcon } from '../snaps/snap-icon';
import { useI18nContext } from '../../../hooks/useI18nContext';

type ConnectedSubject = {
  name?: string;
  iconUrl?: string;
  origin: string;
  extensionId?: string;
};

type ConnectedSitesListProps = {
  connectedSubjects: ConnectedSubject[];
  onDisconnect: (origin: string) => void;
  getSnapName: (origin: string) => string;
};

export default function ConnectedSitesList({
  connectedSubjects,
  onDisconnect,
  getSnapName,
}: ConnectedSitesListProps) {
  const t = useI18nContext();

  const getSubjectDisplayName = useCallback(
    (subject: ConnectedSubject) => {
      if (subject.extensionId) {
        return t('externalExtension');
      }

      // We strip https schemes only, and only if the URL has no port.
      return stripHttpsSchemeWithoutPort(subject.origin);
    },
    [t],
  );

  const getConnectedSitesListContent = () => {
    return connectedSubjects.map((subject) => {
      if (isSnapId(subject.origin)) {
        const snapName = getSnapName(subject.origin);
        return (
          <div
            key={subject.origin}
            className="connected-sites-list__content-row"
          >
            <div className="connected-sites-list__subject-info">
              <SnapIcon avatarSize={IconSize.Md} snapId={subject.origin} />
              <SiteOrigin
                className="connected-sites-list__subject-name"
                title={snapName}
                siteOrigin={snapName}
              />
            </div>
            <Button
              className="connected-sites-list__content-row-link-button"
              onClick={() => onDisconnect(subject.origin)}
              type="link"
            >
              {t('disconnect')}
            </Button>
          </div>
        );
      }
      return (
        <div key={subject.origin} className="connected-sites-list__content-row">
          <div className="connected-sites-list__subject-info">
            <AvatarFavicon
              className="connected-sites-list__subject-icon"
              name={subject.name ?? subject.origin}
              size={AvatarFaviconSize.Md}
              src={subject.iconUrl}
            />
            <SiteOrigin
              className="connected-sites-list__subject-name"
              title={subject.extensionId || subject.origin}
              siteOrigin={getSubjectDisplayName(subject)}
            />
          </div>
          <Button
            className="connected-sites-list__content-row-link-button"
            onClick={() => onDisconnect(subject.origin)}
            type="link"
          >
            {t('disconnect')}
          </Button>
        </div>
      );
    });
  };

  return (
    <main className="connected-sites-list__content-rows">
      {getConnectedSitesListContent()}
    </main>
  );
}
