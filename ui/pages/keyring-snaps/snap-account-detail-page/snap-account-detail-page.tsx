import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import semver from 'semver';
import {
  ButtonVariant,
  Box,
  Button,
  Tag,
  Text,
} from '../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  OverflowWrap,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ADD_SNAP_ACCOUNT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSnapRegistry, getSnaps } from '../../../selectors';
import { SnapDetails } from '../new-snap-account-page';
import { getSnapRoute } from '../../../helpers/utils/util';
import Detail from './detail';
import { SnapDetailHeader } from './header';

interface RouteParams {
  snapId: string;
}

export default function SnapAccountDetailPage() {
  const t = useI18nContext();
  const history = useHistory();

  const { snapId } = useParams<RouteParams>();
  const installedSnaps = useSelector(getSnaps);
  const snapRegistryList: Record<string, SnapDetails> =
    useSelector(getSnapRegistry);
  const currentSnap = Object.values(snapRegistryList).find(
    (snap) => snap.id === snapId,
  );

  if (!currentSnap) {
    history.push(ADD_SNAP_ACCOUNT_ROUTE);
    return null;
  }

  const isInstalled = Boolean(installedSnaps[currentSnap.snapId]);

  const updateAvailable =
    isInstalled &&
    semver.gt(currentSnap.version, installedSnaps[currentSnap.snapId].version);

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
            <Text
              variant={TextVariant.bodyMd}
              overflowWrap={OverflowWrap.BreakWord}
            >
              {currentSnap.developer}
            </Text>
          </Detail>
          <Detail title={t('snapDetailWebsite')}>
            <Button
              variant={ButtonVariant.Link}
              overflowWrap={OverflowWrap.Anywhere}
              href={currentSnap.website}
              externalLink
            >
              {currentSnap.website}
            </Button>
          </Detail>
          <Detail title={t('snapDetailAudits')}>
            {currentSnap.auditUrls.map((auditLink, index) => {
              return (
                <Button
                  key={`audit-link-${index}`}
                  variant={ButtonVariant.Link}
                  overflowWrap={OverflowWrap.Anywhere}
                  href={auditLink}
                  externalLink
                >
                  {auditLink}
                </Button>
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
                variant={ButtonVariant.Link}
                onClick={() => history.push(getSnapRoute(currentSnap.snapId))}
              >
                {t('snapDetailManageSnap')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
