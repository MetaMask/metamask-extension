import { Snap } from '@metamask/snaps-utils';
import React, { useState, useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import semver from 'semver';
import {
  Box,
  Text,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextAlign,
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
import { FEEDBACK_FORM } from '../constants';

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
  const history = useHistory();
  const [showPopup, setShowPopup] = useState(true);
  const installedSnaps: Record<string, Snap> = useSelector(getSnaps);
  const snapRegistryList: Record<string, SnapDetails> = useSelector(
    getSnapRegistry,
    shallowEqual,
  );
  useEffect(() => {
    updateSnapRegistry().catch((err) =>
      console.log(`Failed to fetch snap list: ${err}`),
    );
  }, []);

  const hidePopup = async () => {
    setShowPopup(false);
    await setSnapsAddSnapAccountModalDismissed();
  };

  const snapsAddSnapAccountModalDismissed = useSelector(
    getsnapsAddSnapAccountModalDismissed,
  );

  return (
    <Box
      className="snap-account-page"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      <AddSnapAccountModal
        onClose={async () => {
          await hidePopup();
        }}
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
        <Text
          className="snap-account-subtitle"
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Center}
        >
          {t('snapCreateAccountSubtitle')}
        </Text>
      </Box>
      <Box
        display={Display.Grid}
        flexWrap={FlexWrap.Wrap}
        gap={4}
        padding={[0, 10, 0, 10]}
        className="snap-account-cards"
        marginBottom={'auto'}
      >
        {Object.values(snapRegistryList).map(
          (snap: SnapDetails, index: number) => {
            const foundSnap = Object.values(installedSnaps).find(
              (installedSnap) => installedSnap.id === snap.snapId,
            );

            const isInstalled = Boolean(foundSnap);

            const updateAvailable = Boolean(
              foundSnap?.version && semver.gt(snap.version, foundSnap.version),
            );

            return (
              <SnapCard
                {...snap}
                key={index}
                isInstalled={isInstalled}
                updateAvailable={updateAvailable}
                onClickFunc={() => {
                  history.push(`/add-snap-account/${snap.id}`);
                }}
              />
            );
          },
        )}
      </Box>
      <Box className="snap-account-footer">
        <ButtonLink
          size={ButtonLinkSize.Md}
          data-testid="snap-account-link"
          href={FEEDBACK_FORM}
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          paddingLeft={4}
          marginBottom={4}
          externalLink
        >
          {t('accountSnapsFeedback')}
        </ButtonLink>
      </Box>
    </Box>
  );
}
