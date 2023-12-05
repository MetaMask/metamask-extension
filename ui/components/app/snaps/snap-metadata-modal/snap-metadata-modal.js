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
  FontWeight,
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
import { SnapDelineator } from '../snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { ShowMore } from '../show-more';
import { ConfirmInfoRow } from '../../confirm/shared/info/row';
import SnapExternalPill from '../snap-version/snap-external-pill';

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
        setSafeWebsite(new URL(website));
      }
    };
    if (website) {
      performPhishingCheck();
    }
  }, [website]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="snap-metadata-modal">
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader
          onClose={onClose}
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            gap: 2,
            marginBottom: 4,
          }}
        >
          <Box>
            <SnapAvatar snapId={snapId} />
          </Box>
          <Text variant={TextVariant.bodyMdMedium} textAlign={TextAlign.Center}>
            {snapName}
          </Text>
        </ModalHeader>
        {safeWebsite && (
          <ConfirmInfoRow label={t('snapDetailWebsite')}>
            <ButtonLink
              overflowWrap={OverflowWrap.Anywhere}
              href={safeWebsite.toString()}
              target="_blank"
              externalLink
              textAlign={TextAlign.End}
            >
              {safeWebsite.host}
            </ButtonLink>
          </ConfirmInfoRow>
        )}
        {installOrigin && (
          <ConfirmInfoRow
            label={t('installOrigin')}
            style={{ alignItems: AlignItems.flexStart }}
            tooltip={
              installInfo && (
                <Text>
                  {t('installedOn', [
                    formatDate(installInfo.date, 'dd MMM yyyy'),
                  ])}
                </Text>
              )
            }
          >
            {installOrigin.host}
          </ConfirmInfoRow>
        )}
        <ConfirmInfoRow
          label={t('source')}
          tooltip={
            <Text>
              {t('metadataModalSourceTooltip', [
                <Text
                  key="snap-name"
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.inherit}
                >
                  {snapName}
                </Text>,
                <Text
                  key="snap-id"
                  fontWeight={FontWeight.Medium}
                  variant={TextVariant.inherit}
                >
                  {packageName}
                </Text>,
              ])}
            </Text>
          }
        >
          <SnapExternalPill value={packageName} url={url} />
        </ConfirmInfoRow>
        <ConfirmInfoRow label={t('version')}>
          {`v${subjectMetadata?.version}`}
        </ConfirmInfoRow>
        <SnapDelineator
          type={DelineatorType.Description}
          snapName={snapName}
          boxProps={{ marginTop: 2 }}
        >
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
