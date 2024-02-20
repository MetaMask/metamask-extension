import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  BackgroundColor,
  Color,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { getURLHost } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getOriginOfCurrentTab } from '../../../../selectors';
import { ButtonIcon, ButtonIconSize, IconName, Text } from '../../../component-library';
import { Content, Footer, Header, Page } from '../page';

export const Connections = () => {
  const t = useI18nContext();
  const history = useHistory();
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  return (
    <Page data-testid="connections-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        {/* TODO: Add an Icon */}
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
        >
          {getURLHost(activeTabOrigin)}
        </Text>
      </Header>
      <Content>
        {/* TODO: When no accounts connected - use text */}
        {/* TODO: When accounts connected - create a separate component - Separate Ticket */}
      </Content>
      <Footer>
        {/* TODO: When no accounts connected - Connect Accounts Button */}
        {/* TODO: When accounts connected - Two Separate Buttons - Separate Ticket */}
      </Footer>
    </Page>
  );
};
