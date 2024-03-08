import { getSnapPrefix, stripSnapPrefix } from '@metamask/snaps-utils';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Color,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  OverflowWrap,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { formatDate, getSnapName } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
import {
  getSnapRegistryData,
  getTargetSubjectMetadata,
} from '../../../../selectors';
import { disableSnap, enableSnap } from '../../../../store/actions';
import { Box, ButtonLink, Text } from '../../../component-library';
import ToggleButton from '../../../ui/toggle-button';
import Tooltip from '../../../ui/tooltip/tooltip';
import SnapAvatar from '../snap-avatar';
import SnapExternalPill from '../snap-version/snap-external-pill';
import { useSafeWebsite } from '../../../../hooks/snaps/useSafeWebsite';

const SnapAuthorshipExpanded = ({ snapId, className, snap }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  // We're using optional chaining with snapId, because with the current implementation
  // of snap update in the snap controller, we do not have reference to snapId when an
  // update request is rejected because the reference comes from the request itself and not subject metadata
  // like it is done with snap install
  const snapPrefix = snapId && getSnapPrefix(snapId);
  const packageName = snapId && stripSnapPrefix(snapId);
  const isNPM = snapPrefix === 'npm:';

  const versionPath = snap?.version ? `/v/${snap?.version}` : '';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}${versionPath}`
    : packageName;

  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );
  const snapRegistryData = useSelector((state) =>
    getSnapRegistryData(state, snapId),
  );
  const { website = undefined } = snapRegistryData?.metadata ?? {};
  const safeWebsite = useSafeWebsite(website);

  const friendlyName = snapId && getSnapName(snapId, subjectMetadata);

  const versionHistory = snap?.versionHistory ?? [];
  const installInfo = versionHistory.length
    ? versionHistory[versionHistory.length - 1]
    : undefined;
  const installOrigin = useOriginMetadata(installInfo?.origin);

  const onToggle = () => {
    if (snap?.enabled) {
      dispatch(disableSnap(snap?.id));
    } else {
      dispatch(enableSnap(snap?.id));
    }
  };

  return (
    <Box
      className={classnames('snaps-authorship-expanded', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      width={BlockSize.Full}
      borderRadius={BorderRadius.LG}
    >
      <Box
        alignItems={AlignItems.center}
        display={Display.Flex}
        width={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={3}
        paddingBottom={3}
      >
        <Box>
          <SnapAvatar snapId={snapId} />
        </Box>
        <Box
          marginLeft={4}
          marginRight={0}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          style={{ overflow: 'hidden' }}
        >
          <Text ellipsis fontWeight={FontWeight.Medium}>
            {friendlyName}
          </Text>
          <Text
            ellipsis
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
          >
            {packageName}
          </Text>
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        paddingLeft={4}
        paddingTop={4}
        paddingBottom={4}
        borderColor={BorderColor.borderDefault}
        width={BlockSize.Full}
        style={{
          borderLeft: BorderStyle.none,
          borderRight: BorderStyle.none,
        }}
      >
        <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
          {t('enabled')}
        </Text>
        <Box style={{ maxWidth: '52px' }}>
          <Tooltip interactive position="left" html={t('snapsToggle')}>
            <ToggleButton value={snap?.enabled} onToggle={onToggle} />
          </Tooltip>
        </Box>
      </Box>
      <Box padding={4} width={BlockSize.Full}>
        {safeWebsite && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            width={BlockSize.Full}
            marginBottom={4}
          >
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
              {t('snapDetailWebsite')}
            </Text>
            <Box
              paddingLeft={8}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.flexEnd}
            >
              <ButtonLink
                href={safeWebsite.toString()}
                target="_blank"
                overflowWrap={OverflowWrap.Anywhere}
              >
                {safeWebsite.host}
              </ButtonLink>
            </Box>
          </Box>
        )}
        {installOrigin && installInfo && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            width={BlockSize.Full}
          >
            <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
              {t('installOrigin')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.flexEnd}
            >
              <Text>{installOrigin.host}</Text>
              <Text color={Color.textMuted}>
                {t('installedOn', [
                  formatDate(installInfo.date, 'dd MMM yyyy'),
                ])}
              </Text>
            </Box>
          </Box>
        )}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          marginTop={4}
        >
          <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
            {t('version')}
          </Text>
          <SnapExternalPill value={snap?.version} url={url} />
        </Box>
      </Box>
    </Box>
  );
};

SnapAuthorshipExpanded.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The className of the SnapAuthorship
   */
  className: PropTypes.string,
  /**
   * The snap object.
   */
  snap: PropTypes.object,
};

export default SnapAuthorshipExpanded;
