import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  IconColor,
  TextAlign,
  TextVariant,
  TextColor,
} from '../../helpers/constants/design-system';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../components/component-library';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getCurrentNetwork } from '../../selectors';
import { SampleCounterPane } from './components/sample-counter-pane';
import { SamplePetnamesForm } from './components/sample-petnames-form';
import { SampleNetworkDisplay } from './components/sample-network-display';

export function SamplePage() {
  const t = useI18nContext();
  const history = useHistory();
  const currentNetwork = useSelector(getCurrentNetwork);

  return (
    <Page className="main-container" data-testid="sample-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
            onClick={() => history.push(DEFAULT_ROUTE)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
        >
          Sample Feature
        </Text>
      </Header>
      <Content alignItems={AlignItems.center} gap={2}>
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Center}
          marginTop={0}
          marginBottom={4}
        >
          This is a page demonstrating how to build a sample feature end-to-end
          in MetaMask.
        </Text>

        <SampleNetworkDisplay
          name={currentNetwork.nickname || 'Custom Network'}
          imageUrl={currentNetwork.rpcPrefs?.imageUrl}
        />

        <SampleCounterPane />
        <SamplePetnamesForm />
      </Content>
    </Page>
  );
}
