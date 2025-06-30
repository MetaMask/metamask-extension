import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasProperty } from '@metamask/utils';
import {
  AlignItems,
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE, SNAPS_ROUTE } from '../../../helpers/constants/routes';
import { getSnaps, getPermissions } from '../../../selectors';
import {
  ButtonIcon,
  Box,
  ButtonIconSize,
} from '../../../components/component-library';
import { Content, Page } from '../../../components/multichain/pages/page';
import SnapAuthorshipHeader from '../../../components/app/snaps/snap-authorship-header';
import SnapHomeMenu from '../../../components/app/snaps/snap-home-menu';
import { SnapHomeRenderer } from '../../../components/app/snaps/snap-home-page/snap-home-renderer';
import SnapSettings from './snap-settings';

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

  const hasHomePage =
    permissions && hasProperty(permissions, 'endowment:page-home');
  const [showSettings, setShowSettings] = useState(!hasHomePage);
  const [initRemove, setInitRemove] = useState(false);

  if (!snap) {
    return null;
  }

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSnapRemove = () => {
    setInitRemove(true);
    setShowSettings(true);
  };

  const resetInitRemove = () => {
    setInitRemove(false);
  };

  const handleBackClick = () => {
    if (snap.preinstalled && snap.hidden) {
      history.push(DEFAULT_ROUTE);
    } else if (showSettings && hasHomePage) {
      setShowSettings(false);
    } else {
      history.push(SNAPS_ROUTE);
    }
  };

  const renderBackButton = () => {
    return (
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        <ButtonIcon
          ariaLabel="Back"
          iconName="arrow-left"
          size={ButtonIconSize.Md}
          onClick={handleBackClick}
        />
      </Box>
    );
  };

  return (
    <div className="snap-view">
      <Page backgroundColor={BackgroundColor.backgroundDefault}>
        {!snap.hideSnapBranding && (
          <SnapAuthorshipHeader
            snapId={snapId}
            showInfo={false}
            startAccessory={renderBackButton()}
            endAccessory={
              !snap.hidden && (
                <SnapHomeMenu
                  snapId={snapId}
                  onSettingsClick={handleSettingsClick}
                  onRemoveClick={handleSnapRemove}
                  isSettingsAvailable={!snap.preinstalled}
                />
              )
            }
          />
        )}
        <Content
          backgroundColor={BackgroundColor.backgroundDefault}
          className="snap-view__content"
          marginTop={showSettings ? 4 : 0}
          padding={showSettings ? 4 : 0}
        >
          {showSettings ? (
            <SnapSettings
              snapId={snapId}
              initRemove={initRemove}
              resetInitRemove={resetInitRemove}
            />
          ) : (
            <SnapHomeRenderer snapId={snapId} />
          )}
        </Content>
      </Page>
    </div>
  );
}

export default SnapView;
