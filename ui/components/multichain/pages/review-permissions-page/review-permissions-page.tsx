import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  BackgroundColor,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getConnectedSitesListWithNetworkInfo } from '../../../../selectors/index';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';
import { Content, Footer, Header, Page } from '../page';
import { SiteCell } from './index';

export const ReviewPermissions = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const sitesConnectionsList = useSelector(
    getConnectedSitesListWithNetworkInfo,
  );
  console.log(sitesConnectionsList, 'sitesConnectionsList');
  return (
    <Page
      data-testid="connections-page"
      className="main-container connections-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            size={ButtonIconSize.Sm}
          />
        }
      ></Header>
      <Content padding={0}>
        <SiteCell />
      </Content>

    </Page>
  );
};
