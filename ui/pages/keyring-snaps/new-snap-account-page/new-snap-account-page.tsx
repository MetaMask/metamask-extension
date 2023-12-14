import { Snap } from '@metamask/snaps-utils';
import React, { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import semver from 'semver';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getSnapRegistry,
  getSnaps,
  getsnapsAddSnapAccountModalDismissed,
} from '../../../selectors';
import {
  setSnapsAddSnapAccountModalDismissed,
  updateSnapRegistry,
} from '../../../store/actions';
import AddSnapAccountModal from '../add-snap-account-modal';
import SnapCard from '../snap-card/snap-card';
import { FEEDBACK_FORM } from '../constants';
import { CONSENSYS_TERMS_OF_USE } from '../../../../shared/lib/ui-utils';

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

  const legalDisclaimerContent = [
    {
      title: t('snapAccountLegalDisclaimerThirdPartySubtitle'),
      description: t('snapAccountLegalDisclaimerThirdPartyDescription', [
        <ButtonLink
          href={CONSENSYS_TERMS_OF_USE}
          variant={TextVariant.bodyXs}
          externalLink
        >
          {t('snapAccountLegalDisclaimerTermsOfUseLink')}
        </ButtonLink>,
      ]),
    },
    {
      title: t('snapAccountLegalDisclaimerPrivacySubtitle'),
      description: t('snapAccountLegalDisclaimerPrivacyDescription'),
    },
    {
      title: t('snapAccountLegalDisclaimerExperimentalBetaSubtitle'),
      description: t('snapAccountLegalDisclaimerExperimentalBetaDescription'),
    },
  ];

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
        <Box className="legal-disclaimer">
          <Text
            variant={TextVariant.bodyXsMedium}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Left}
            fontWeight={FontWeight.Bold}
          >
            {t('snapAccountLegalDisclaimerTitle').toUpperCase()}
          </Text>
          <>
            {legalDisclaimerContent.map((element, index) => (
              <Box
                id={`legal-disclaimer-element-${index}`}
                className="legal-disclaimer-element"
              >
                <Text
                  variant={TextVariant.bodyXsMedium}
                  color={TextColor.textAlternative}
                  textAlign={TextAlign.Left}
                  fontWeight={FontWeight.Bold}
                >
                  {element.title}
                </Text>
                <Text
                  variant={TextVariant.bodyXs}
                  color={TextColor.textAlternative}
                  textAlign={TextAlign.Left}
                >
                  {element.description}
                </Text>
              </Box>
            ))}
          </>
        </Box>
        <ButtonLink
          className="feedback-link"
          size={ButtonLinkSize.Sm}
          data-testid="snap-account-link"
          href={FEEDBACK_FORM}
          display={Display.Flex}
          paddingLeft={4}
          marginBottom={4}
          textAlign={TextAlign.Center}
          externalLink
        >
          {t('accountSnapsFeedback')}
        </ButtonLink>
      </Box>
    </Box>
  );
}
