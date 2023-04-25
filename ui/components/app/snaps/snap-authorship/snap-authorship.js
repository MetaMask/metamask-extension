import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getSnapPrefix } from '@metamask/snaps-utils';
import { useDispatch, useSelector } from 'react-redux';
import Box from '../../../ui/box';
import {
  BackgroundColor,
  TextColor,
  FLEX_DIRECTION,
  TextVariant,
  BorderColor,
  AlignItems,
  DISPLAY,
  BLOCK_SIZES,
  JustifyContent,
  BorderStyle,
  Color,
} from '../../../../helpers/constants/design-system';
import {
  formatDate,
  getSnapName,
  removeSnapIdPrefix,
} from '../../../../helpers/utils/util';

import { Text, ButtonLink } from '../../../component-library';
import { getTargetSubjectMetadata } from '../../../../selectors';
import SnapAvatar from '../snap-avatar';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Tooltip from '../../../ui/tooltip/tooltip';
import ToggleButton from '../../../ui/toggle-button';
import { disableSnap, enableSnap } from '../../../../store/actions';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
import SnapVersion from '../snap-version/snap-version';

const SnapAuthorship = ({ snapId, className, expanded = false, snap }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  // We're using optional chaining with snapId, because with the current implementation
  // of snap update in the snap controller, we do not have reference to snapId when an
  // update request is rejected because the reference comes from the request itself and not subject metadata
  // like it is done with snap install
  const snapPrefix = snapId && getSnapPrefix(snapId);
  const packageName = snapId && removeSnapIdPrefix(snapId);
  const isNPM = snapPrefix === 'npm:';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}`
    : packageName;

  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const friendlyName = snapId && getSnapName(snapId, subjectMetadata);

  if (expanded && !snap) {
    throw new Error("Can't expand SnapAuthorship, the snap object is missing.");
  }

  // Expanded data
  const versionHistory = snap?.versionHistory ?? [];
  const installInfo = versionHistory.length
    ? versionHistory[versionHistory.length - 1]
    : undefined;
  const installOrigin = useOriginMetadata(installInfo?.origin);

  const onToggle = () => {
    if (snap.enabled) {
      dispatch(disableSnap(snap.id));
    } else {
      dispatch(enableSnap(snap.id));
    }
  };

  return (
    <Box
      className={classnames('snaps-authorship', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      width={BLOCK_SIZES.FULL}
      style={{
        borderRadius: expanded ? `24px 24px 8px 8px` : '999px',
      }}
    >
      <Box
        alignItems={AlignItems.center}
        display={DISPLAY.FLEX}
        width={BLOCK_SIZES.FULL}
        paddingLeft={expanded ? 4 : 2}
        paddingRight={expanded ? 4 : 2}
        paddingTop={expanded ? 3 : 1}
        paddingBottom={expanded ? 3 : 1}
      >
        <Box>
          <SnapAvatar snapId={snapId} />
        </Box>
        <Box
          marginLeft={2}
          marginRight={expanded ? 0 : 2}
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
          style={{ overflow: 'hidden' }}
        >
          <Text ellipsis>{friendlyName}</Text>
          <Text
            ellipsis
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
          >
            {packageName}
          </Text>
        </Box>
        {!expanded && (
          <Box marginLeft="auto">
            <SnapVersion version={subjectMetadata?.version} url={url} />
          </Box>
        )}
      </Box>
      {expanded && (
        <Box flexDirection={FLEX_DIRECTION.COLUMN} width={BLOCK_SIZES.FULL}>
          <Box
            flexDirection={FLEX_DIRECTION.ROW}
            justifyContent={JustifyContent.spaceBetween}
            paddingLeft={4}
            paddingTop={4}
            paddingBottom={4}
            borderColor={BorderColor.borderDefault}
            width={BLOCK_SIZES.FULL}
            style={{
              borderLeft: BorderStyle.none,
              borderRight: BorderStyle.none,
            }}
          >
            <Text variant={TextVariant.bodyMdBold}>{t('enableSnap')}</Text>
            <Box style={{ maxWidth: '52px' }}>
              <Tooltip interactive position="left" html={t('snapsToggle')}>
                <ToggleButton value={snap.enabled} onToggle={onToggle} />
              </Tooltip>
            </Box>
          </Box>
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            padding={4}
            width={BLOCK_SIZES.FULL}
          >
            <Box
              flexDirection={FLEX_DIRECTION.ROW}
              justifyContent={JustifyContent.spaceBetween}
              width={BLOCK_SIZES.FULL}
            >
              <Text variant={TextVariant.bodyMdBold}>{t('installOrigin')}</Text>
              <Box
                flexDirection={FLEX_DIRECTION.COLUMN}
                alignItems={AlignItems.flexEnd}
              >
                <ButtonLink href={installOrigin.origin} target="_blank">
                  {installOrigin.host}
                </ButtonLink>
                <Text color={Color.textMuted}>
                  {t('installedOn', [
                    formatDate(installInfo.date, 'dd MMM yyyy'),
                  ])}
                </Text>
              </Box>
            </Box>
            <Box
              flexDirection={FLEX_DIRECTION.ROW}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              marginTop={4}
            >
              <Text variant={TextVariant.bodyMdBold}>{t('version')}</Text>
              <SnapVersion version={subjectMetadata?.version} url={url} />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

SnapAuthorship.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The className of the SnapAuthorship
   */
  className: PropTypes.string,
  /**
   * If the authorship component should be expanded
   */
  expanded: PropTypes.bool,
  /**
   * The snap object. Can be undefined if the component is not expanded
   */
  snap: PropTypes.object,
};

export default SnapAuthorship;
