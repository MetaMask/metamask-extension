import { Snap } from '@metamask/snaps-utils';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Box, Text } from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getSnaps,
  getsnapsAddSnapAccountModalDismissed,
  getSnapRegistry,
} from '../../../selectors';
import {
  setSnapsAddSnapAccountModalDismissed,
  updateSnapRegistry,
} from '../../../store/actions';
import AddSnapAccountModal from '../add-snap-account-modal';
import SnapCard from '../snap-card/snap-card';

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

function getShuffledSnapList(arr: SnapDetails[]): SnapDetails[] {
  return [...arr].map((_, i, arrCopy) => {
    const rand = i + Math.floor(Math.random() * (arrCopy.length - i));
    [arrCopy[rand], arrCopy[i]] = [arrCopy[i], arrCopy[rand]];
    return arrCopy[i];
  });
}

export default function NewSnapAccountPage() {
  const t = useI18nContext();
  const installedSnaps: Record<string, Snap> = useSelector(getSnaps);
  const snapRegistryList: Record<string, SnapDetails> =
    useSelector(getSnapRegistry);
  const snapList = getShuffledSnapList(Object.values(snapRegistryList));

  const [showPopup, setShowPopup] = useState(true);
  const history = useHistory();

  useEffect(() => {
    updateSnapRegistry();
  }, []);

  const hidePopup = () => {
    setShowPopup(false);
    setSnapsAddSnapAccountModalDismissed();
  };

  const snapsAddSnapAccountModalDismissed = useSelector(
    getsnapsAddSnapAccountModalDismissed,
  );

  return (
    <Box className="snap-account-page">
      <AddSnapAccountModal
        onClose={hidePopup}
        isOpen={showPopup && !snapsAddSnapAccountModalDismissed}
      />
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
        {snapList.map((snap: SnapDetails, index: number) => {
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
