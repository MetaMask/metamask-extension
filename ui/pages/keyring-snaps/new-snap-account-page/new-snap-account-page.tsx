import { Snap } from '@metamask/snaps-utils';
import React, { useState, useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import semver from 'semver';
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
  metadata: {
    name: string;
    author: {
      name: string;
      website: string;
    };
    summary: string;
    description: string;
    audits: {
      auditor: string;
      report: string;
    }[];
    category:
      | 'interoperability'
      | 'notifications'
      | 'transaction insights'
      | 'key management';
    tags?: string[];
  };
  support?: {
    knowledgeBase?: string;
    faq?: string;
    contact?: string;
  };
  onboard?: string;
  sourceCode?: string;
  versions: {
    [version: string]: {
      checksum: string;
    };
  };
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
    <Box className="snap-account-page">
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
        {Object.values(snapRegistryList?.verifiedSnaps || {})
          .filter((snap) => snap.metadata.category === 'key management')
          .map((snap: SnapDetails, index: number) => {
            const foundSnap = Object.values(installedSnaps).find(
              (installedSnap) => installedSnap.id === snap.id,
            );

            const isInstalled = Boolean(foundSnap);

            const latestVersion = Object.keys(snap?.versions ?? []).sort(
              (a, b) => semver.compare(a, b),
            )[0];

            const updateAvailable = Boolean(
              foundSnap?.version && semver.gt(latestVersion, foundSnap.version),
            );

            return (
              <SnapCard
                {...snap}
                key={index}
                isInstalled={isInstalled}
                updateAvailable={updateAvailable}
                onClickFunc={() => {
                  history.push(
                    `/add-snap-account/${encodeURIComponent(snap.id)}`,
                  );
                }}
              />
            );
          })}
      </Box>
    </Box>
  );
}
