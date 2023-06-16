import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Text } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import AddSnapAccountPopup from '../../../components/app/add-snap-account-popup/add-snap-account-popup';
import SnapCard from '../snap-card/snap-card';
import { KEY_MANAGEMENT_SNAPS } from '../../../../app/scripts/controllers/permissions/snaps/keyManagementSnaps';
import { getSnaps, getSnapsList } from '../../../selectors';
import { Snap } from '@metamask/snaps-utils';

export interface SnapDetails {
  id: string;
  snapId: string;
  iconUrl: string;
  snapTitle: string;
  snapSlug: string;
  snapDescription: string;
  tags: string[];
  developer: string;
  website: string;
  auditUrls: string[];
  version: string;
  lastUpdated: string;
}

export interface SnapCardProps extends SnapDetails {
  isInstalled: boolean;
  updateAvailable: boolean;
}

export default function NewSnapAccountPage() {
  const t = useI18nContext();
  const installedSnaps: Record<string, Snap> = useSelector(getSnaps);
  console.log(installedSnaps);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [snapList, setSnapList] = useState(KEY_MANAGEMENT_SNAPS);
  const [showPopup, setShowPopup] = useState(true);
  const history = useHistory();

  const hidePopup = () => {
    setShowPopup(false);
  };

  return (
    <Box className="snap-account-page">
      <AddSnapAccountPopup onClose={hidePopup} isOpen={showPopup} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        marginTop={11}
        marginBottom={11}
      >
        <Text variant={TextVariant.headingLg}>
          {t('snapCreateAccountTitle', [
            <Text
              variant={TextVariant.headingLg}
              as="span"
              className="snap-account-color-text"
              key="snap-title-2"
            >
              {t('snapCreateAccountTitle2')}
            </Text>,
          ])}
        </Text>
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {t('snapCreateAccountSubtitle')}
        </Text>
      </Box>
      <Box
        display={Display.Grid}
        flexWrap={FlexWrap.Wrap}
        gap={4}
        padding={[0, 10, 0, 10]}
        className="snap-account-cards"
      >
        {snapList.map((snap, index: number) => {
          const foundSnap = Object.values(installedSnaps).find(
            (installedSnap) => installedSnap.id === snap.snapId,
          );

          const isInstalled = Boolean(foundSnap);

          return (
            <SnapCard
              {...snap}
              key={index}
              isInstalled={isInstalled}
              onClickFunc={() => {
                history.push(`/add-snap-account/${snap.id}`);
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
