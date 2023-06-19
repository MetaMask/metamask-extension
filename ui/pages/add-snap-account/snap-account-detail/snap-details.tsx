import React from 'react';

import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import semver from 'semver';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  BUTTON_VARIANT,
  Button,
  Tag,
  Text,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ADD_SNAP_ACCOUNT_ROUTE,
  SNAPS_VIEW_ROUTE,
} from '../../../helpers/constants/routes';
import { KEY_MANAGEMENT_SNAPS } from '../../../../app/scripts/controllers/permissions/snaps/keyManagementSnaps';
import { getSnaps } from '../../../selectors';
import Detail from './detail';
import { SnapDetailHeader } from './header';

interface RouteParams {
  snapId: string;
}

const SnapDetailsPage = () => {
  const t = useI18nContext();
  const history = useHistory();

  const { snapId } = useParams<RouteParams>();
  const installedSnaps = useSelector(getSnaps);
  const currentSnap = Object.values(KEY_MANAGEMENT_SNAPS).find(
    (snap) => snap.id === snapId,
  );

  if (!currentSnap) {
    history.push(ADD_SNAP_ACCOUNT_ROUTE);
    return null;
  }

  const isInstalled = Boolean(installedSnaps[currentSnap.snapId]);

  const updateAvailable = isInstalled
    ? semver.gt(currentSnap.version, installedSnaps[currentSnap.snapId].version)
    : false;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      padding={[10, 10, 10, 10]}
      className="snap-details-page"
    >
      <SnapDetailHeader
        {...currentSnap}
        updateAvailable={updateAvailable}
        isInstalled={isInstalled}
      />
      <Box display={Display.Flex}>
        <Box
          width={BlockSize.FourFifths}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
        >
          <Text
            variant={TextVariant.bodyMdBold}
            marginBottom={2}
            color={TextColor.textAlternative}
          >
            {currentSnap.snapSlug}
          </Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {currentSnap.snapDescription}
          </Text>
        </Box>
        <Box
          width={BlockSize.OneFifth}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={4}
        >
          <Detail title={t('snapDetailTags')}>
            {currentSnap.tags.map((tag, index) => {
              return (
                <Tag
                  label={tag}
                  labelProps={{
                    color: TextColor.textAlternative,
                  }}
                  className=""
                  key={`tag-${index}`}
                  marginRight={1}
                />
              );
            })}
          </Detail>
          <Detail title={t('snapDetailDeveloper')}>
            <Text variant={TextVariant.bodyMd}>{currentSnap.developer}</Text>
          </Detail>
          <Detail title={t('snapDetailWebsite')}>{currentSnap.website}</Detail>
          <Detail title={t('snapDetailAudits')}>
            {currentSnap.auditUrls.map((auditLink, index) => {
              return (
                <Text key={`audit-link-${index}`}>
                  <Button variant={BUTTON_VARIANT.LINK} href={auditLink}>
                    {auditLink}
                  </Button>
                </Text>
              );
            })}
          </Detail>
          <Detail title={t('snapDetailVersion')}>
            <Text variant={TextVariant.bodyMd}>{currentSnap.version}</Text>
          </Detail>
          <Detail title={t('snapDetailLastUpdated')}>
            <Text variant={TextVariant.bodyMd}>{currentSnap.lastUpdated}</Text>
          </Detail>
          {isInstalled && (
            <Box>
              <Button
                variant={BUTTON_VARIANT.LINK}
                onClick={() =>
                  history.push(
                    `${SNAPS_VIEW_ROUTE}/${encodeURIComponent(
                      currentSnap.snapId,
                    )}`,
                  )
                }
              >
                {t('snapDetailManageSnap')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SnapDetailsPage;
