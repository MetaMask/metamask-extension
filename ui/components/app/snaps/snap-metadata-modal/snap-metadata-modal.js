import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getSnapPrefix, stripSnapPrefix } from '@metamask/snaps-utils';
import {
  getSnap,
  getSnapRegistryData,
  getTargetSubjectMetadata,
} from '../../../../selectors';
import {
  Box,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
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
  FontWeight,
  IconColor,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import SnapAvatar from '../snap-avatar';
import { formatDate, getSnapName } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
import { SnapDelineator } from '../snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { ShowMore } from '../show-more';
import SnapExternalPill from '../snap-version/snap-external-pill';
import { useSafeWebsite } from '../../../../hooks/snaps/useSafeWebsite';
import Tooltip from '../../../ui/tooltip';

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
  const packageName = stripSnapPrefix(snapId);
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

  const safeWebsite = useSafeWebsite(website);

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
            marginBottom: 6,
          }}
        >
          <Box>
            <SnapAvatar snapId={snapId} />
          </Box>
          <Text variant={TextVariant.bodyMdMedium} textAlign={TextAlign.Center}>
            {snapName}
          </Text>
        </ModalHeader>
        <Box marginLeft={4} marginRight={4}>
          {safeWebsite && (
            <Box
              display={Display.Flex}
              FlexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              flexWrap={FlexWrap.NoWrap}
            >
              <Text variant={TextVariant.bodyMdMedium} marginRight={4}>
                {t('snapDetailWebsite')}
              </Text>

              <ButtonLink
                overflowWrap={OverflowWrap.Anywhere}
                href={safeWebsite.toString()}
                target="_blank"
                externalLink
                textAlign={TextAlign.End}
                ellipsis
              >
                {safeWebsite.host}
              </ButtonLink>
            </Box>
          )}
          {installOrigin && (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              flexWrap={FlexWrap.NoWrap}
              marginTop={4}
            >
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                alignItems={AlignItems.center}
                marginRight={4}
              >
                <Text variant={TextVariant.bodyMdMedium} marginRight={1}>
                  {t('installOrigin')}
                </Text>
                {installInfo && (
                  <Tooltip
                    html={t('installedOn', [
                      formatDate(installInfo.date, 'dd MMM yyyy'),
                    ])}
                    position="bottom"
                  >
                    <Icon
                      color={IconColor.iconMuted}
                      name={IconName.Info}
                      size={IconSize.Sm}
                    />
                  </Tooltip>
                )}
              </Box>
              <Text ellipsis>{installOrigin.host}</Text>
            </Box>
          )}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            flexWrap={FlexWrap.NoWrap}
            marginTop={4}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              marginRight={4}
            >
              <Text variant={TextVariant.bodyMdMedium} marginRight={1}>
                {t('source')}
              </Text>
              <Tooltip
                html={t('metadataModalSourceTooltip', [
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
                position="bottom"
              >
                <Icon
                  color={IconColor.iconMuted}
                  name={IconName.Info}
                  size={IconSize.Sm}
                />
              </Tooltip>
            </Box>
            <SnapExternalPill value={packageName} url={url} />
          </Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            flexWrap={FlexWrap.NoWrap}
            marginTop={4}
          >
            <Text variant={TextVariant.bodyMdMedium} marginRight={4}>
              {t('version')}
            </Text>
            <Text ellipsis>{subjectMetadata?.version}</Text>
          </Box>
          <SnapDelineator
            type={DelineatorType.Description}
            snapName={snapName}
            boxProps={{ marginTop: 4 }}
          >
            <ShowMore>
              <Text>{snap?.manifest.description}</Text>
            </ShowMore>
          </SnapDelineator>
        </Box>
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
