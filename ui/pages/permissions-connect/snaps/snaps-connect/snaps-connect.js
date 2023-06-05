import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { isObject } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/rpc-methods';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../../components/ui/box';
import { getPermissions } from '../../../../selectors';
import SiteOrigin from '../../../../components/ui/site-origin';
import IconWithFallback from '../../../../components/ui/icon-with-fallback/icon-with-fallback.component';
import {
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import {
  IconColor,
  FlexDirection,
  TextVariant,
  JustifyContent,
  AlignItems,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import SnapConnectCell from '../../../../components/app/snaps/snap-connect-cell/snap-connect-cell';
import { getSnapName } from '../../../../helpers/utils/util';

export default function SnapsConnect({
  request,
  approveConnection,
  rejectConnection,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();
  const { origin, iconUrl, name } = targetSubjectMetadata;
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentPermissions = useSelector((state) =>
    getPermissions(state, request?.metadata?.origin),
  );

  const onCancel = () => {
    rejectConnection(request.metadata.id);
  };

  const onConnect = () => {
    try {
      setIsLoading(true);
      approveConnection(request);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getDedupedSnaps = () => {
    const permission = request.permissions?.[WALLET_SNAP_PERMISSION_KEY];
    const requestedSnaps = permission?.caveats?.[0].value;

    const currentSnaps =
      currentPermissions?.[WALLET_SNAP_PERMISSION_KEY]?.caveats?.[0].value;

    if (!isObject(currentSnaps) && requestedSnaps) {
      return Object.keys(requestedSnaps);
    }

    const requestedSnapKeys = requestedSnaps ? Object.keys(requestedSnaps) : [];
    const currentSnapKeys = currentSnaps ? Object.keys(currentSnaps) : [];
    const dedupedSnaps = requestedSnapKeys.filter(
      (snapId) => !currentSnapKeys.includes(snapId),
    );

    return dedupedSnaps;
  };

  const SnapsConnectContent = () => {
    const snaps = getDedupedSnaps();
    if (snaps?.length > 1) {
      return (
        <Box
          className="snaps-connect__content"
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
        >
          <Text variant={TextVariant.bodyMdBold}>{t('connectionRequest')}</Text>
          <Text>
            {t('multipleSnapConnectionWarning', [origin, snaps?.length])}
          </Text>
          <Box
            className="snaps-connect__content__snaps-list"
            flexDirection={FlexDirection.Column}
          >
            {snaps.map((snap) => (
              // TODO(hbmalik88): add in the iconUrl prop when we have access to a snap's icons pre-installation
              <SnapConnectCell
                key={`snaps-connect-${snap}`}
                snapId={snap}
                origin={origin}
              />
            ))}
          </Box>
        </Box>
      );
    }
    return (
      <Box
        className="snaps-connect__content"
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        <Box
          className="snaps-connect__content__icons"
          flexDirection={FlexDirection.Row}
        >
          <IconWithFallback
            className="snaps-connect__content__icons__site-icon"
            icon={iconUrl}
            name={name}
            size={32}
          />
          <hr className="snaps-connect__content__icons__connection-line" />
          <Icon
            className="snaps-connect__content__icons__question"
            name={IconName.Question}
            size={IconSize.Xl}
            color={IconColor.infoInverse}
          />
          <hr className="snaps-connect__content__icons__connection-line" />
          <Icon
            className="snaps-connect__content__icons__snap"
            name={IconName.Snaps}
            size={IconSize.Xl}
            color={IconColor.primaryDefault}
          />
        </Box>
        <Text variant={TextVariant.headingLg}>{t('connectionRequest')}</Text>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          padding={[0, 4]}
        >
          {t('snapConnectionWarning', [
            <b key="0">{origin}</b>,
            <b key="1">{getSnapName(snaps?.[0])}</b>,
          ])}
        </Text>
      </Box>
    );
  };

  const SnapsConnectError = () => {
    return (
      <Box className="snaps-connect__error">
        <IconWithFallback
          className="snaps-connect__error__site-icon"
          icon={iconUrl}
          name={name}
          size={32}
        />
        <hr className="snaps-connect__error__connection-line" />
        <Icon
          className="snaps-connect__error__question"
          name={IconName.CircleX}
          size={IconSize.Xl}
          color={IconColor.errorDefault}
        />
        <Icon
          className="snaps-connect__error__snap"
          name={IconName.Snaps}
          size={IconSize.Xl}
          color={IconColor.primaryDefault}
        />
      </Box>
    );
  };

  return (
    <Box
      className="page-container snaps-connect"
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
    >
      <SiteOrigin
        chip
        siteOrigin={origin}
        title={origin}
        iconSrc={iconUrl}
        name={name}
      />
      {hasError ? <SnapsConnectError /> : <SnapsConnectContent />}
      <PageContainerFooter
        cancelButtonType="default"
        hideCancel={false}
        disabled={isLoading}
        onCancel={onCancel}
        cancelText={t('cancel')}
        onSubmit={hasError ? onCancel : onConnect}
        submitText={t(hasError ? 'ok' : 'connect')}
      />
    </Box>
  );
}

SnapsConnect.propTypes = {
  request: PropTypes.object.isRequired,
  approveConnection: PropTypes.func.isRequired,
  rejectConnection: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.shape({
    extensionId: PropTypes.string,
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string,
    subjectType: PropTypes.string,
  }),
};
