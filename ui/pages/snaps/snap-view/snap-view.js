import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasProperty } from '@metamask/utils';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { SNAPS_ROUTE } from '../../../helpers/constants/routes';
import {
  getSnaps,
  getPermissions,
  getTargetSubjectMetadata,
} from '../../../selectors';
import { getSnapName } from '../../../helpers/utils/util';
import { ButtonIcon } from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import SnapSettings from './snap-settings';
import SnapHome from './snap-home';

function SnapView() {
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  // The snap ID is in URI-encoded form in the last path segment of the URL.
  const snapId = decodeURIComponent(pathname.match(/[^/]+$/u)[0]);
  const snaps = useSelector(getSnaps);
  const snap = Object.entries(snaps)
    .map(([_, snapState]) => snapState)
    .find((snapState) => snapState.id === snapId);

  useEffect(() => {
    if (!snap) {
      history.push(SNAPS_ROUTE);
    }
  }, [history, snap]);

  const permissions = useSelector(
    (state) => snap && getPermissions(state, snap.id),
  );

  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snap?.id),
  );

  const hasHomePage =
    permissions && hasProperty(permissions, 'endowment:page-home');
  const [showSettings, setShowSettings] = useState(!hasHomePage);

  if (!snap) {
    return null;
  }

  const snapName = getSnapName(snap.id, targetSubjectMetadata);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleBackClick = () => {
    if (showSettings && hasHomePage) {
      setShowSettings(false);
    } else {
      history.push(SNAPS_ROUTE);
    }
  };

  return (
    <div className="snap-view">
      <Page backgroundColor={BackgroundColor.backgroundDefault}>
        <Header
          backgroundColor={BackgroundColor.backgroundDefault}
          startAccessory={
            <ButtonIcon
              ariaLabel="Back"
              iconName="arrow-left"
              size="sm"
              onClick={handleBackClick}
            />
          }
          endAccessory={
            !showSettings && (
              <ButtonIcon
                ariaLabel="Settings"
                iconName="setting"
                size="sm"
                onClick={handleSettingsClick}
              />
            )
          }
        >
          {snapName}
        </Header>
        <Content
          backgroundColor={BackgroundColor.backgroundDefault}
          className="snap-view__content"
          paddingTop={0}
        >
          {showSettings ? (
            <SnapSettings snapId={snapId} />
          ) : (
            <SnapHome snapId={snapId} />
          )}
        </Content>
      </Page>
    </div>
  );
}

export default SnapView;
