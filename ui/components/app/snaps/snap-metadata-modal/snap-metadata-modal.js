import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getSnapPrefix } from '@metamask/snaps-utils';
import {
  getSnap,
  getSnapRegistryData,
  getTargetSubjectMetadata,
} from '../../../../selectors';
import {
  Box,
  ButtonLink,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import SnapAvatar from '../snap-avatar';
import {
  formatDate,
  getSnapName,
  removeSnapIdPrefix,
} from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getPhishingResult } from '../../../../store/actions';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
import SnapVersion from '../snap-version';
import { SnapDelineator } from '../snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { ShowMore } from '../show-more';
import InfoTooltip from '../../../ui/info-tooltip';

export const SnapMetadataModal = ({ snapId, isOpen, onClose }) => {
  const t = useI18nContext();

  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const snap = useSelector((state) => getSnap(state, snapId));

  const versionHistory = snap?.versionHistory ?? [];
  const installInfo = versionHistory.length
    ? versionHistory[versionHistory.length - 1]
    : undefined;

  const installOrigin = useOriginMetadata(installInfo?.origin);

  const snapName = getSnapName(snapId, subjectMetadata);
  const snapPrefix = getSnapPrefix(snapId);
  const packageName = removeSnapIdPrefix(snapId);
  const isNPM = snapPrefix === 'npm:';
  const versionPath = subjectMetadata?.version
    ? `/v/${subjectMetadata?.version}`
    : '';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}${versionPath}`
    : packageName;

  const snapRegistryData = useSelector((state) =>
    getSnapRegistryData(state, snapId),
  );

  const { website = undefined } = snapRegistryData?.metadata ?? {};
  const [safeWebsite, setSafeWebsite] = useState(null);

  useEffect(() => {
    const performPhishingCheck = async () => {
      const phishingResult = await getPhishingResult(website);

      if (!phishingResult.result) {
        setSafeWebsite(website);
      }
    };
    if (website) {
      performPhishingCheck();
    }
  }, [website]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          gap: 4,
        }}
      >
        <ModalHeader
          onClose={onClose}
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            gap: 2,
          }}
        >
          <Box>
            <SnapAvatar snapId={snapId} />
          </Box>
          <Text variant={TextVariant.bodyMdMedium} textAlign={TextAlign.Center}>
            {snapName}
          </Text>
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            flexWrap={FlexWrap.NoWrap}
            marginRight={5}
          >
            <Text
              marginRight={1}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              {t('source')}
            </Text>
            <InfoTooltip contentText="TBD" />
          </Box>
          <Text
            textAlign={TextAlign.End}
            color={TextColor.textAlternative}
            overflowWrap={OverflowWrap.Anywhere}
            variant={TextVariant.bodyMd}
          >
            {packageName}
          </Text>
        </Box>
        {safeWebsite && (
          <Box
            color={TextColor.textAlternative}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text marginRight={5} variant={TextVariant.bodyMdMedium}>
              {t('snapDetailWebsite')}
            </Text>
            <ButtonLink
              overflowWrap={OverflowWrap.Anywhere}
              href={safeWebsite}
              target="_blank"
              externalLink
              textAlign={TextAlign.End}
            >
              {safeWebsite}
            </ButtonLink>
          </Box>
        )}
        {installOrigin && (
          <Box
            color={TextColor.textAlternative}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text marginRight={5} variant={TextVariant.bodyMdMedium}>
              {t('installOrigin')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.flexEnd}
            >
              <Text textAlign={TextAlign.End}>{installOrigin.host}</Text>
              {installInfo && (
                <Text color={TextColor.textMuted} textAlign={TextAlign.End}>
                  {t('installedOn', [
                    formatDate(installInfo.date, 'dd MMM yyyy'),
                  ])}
                </Text>
              )}
            </Box>
          </Box>
        )}
        <Box
          color={TextColor.textAlternative}
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.Center}
        >
          <Text marginRight={5} variant={TextVariant.bodyMdMedium}>
            {t('version')}
          </Text>
          <SnapVersion version={subjectMetadata?.version} url={url} />
        </Box>
        <SnapDelineator type={DelineatorType.Description} snapName={snapName}>
          <ShowMore>
            <Text>{snap?.manifest.description}</Text>
          </ShowMore>
        </SnapDelineator>
      </ModalContent>
    </Modal>
  );
};

SnapMetadataModal.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * Whether if the modal is open or not
   */
  isOpen: PropTypes.bool,
  /**
   * onClose handler
   */
  onClose: PropTypes.func,
};
