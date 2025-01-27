import React, { useCallback, useState } from 'react';
import {
  AlignItems,
  BackgroundColor,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Button,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';
import { Content, Header, Page } from '../../multichain/pages/page';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useSample } from '../../../hooks/sample/useSample';
import { useSampleContext } from '../../../hooks/sample/useSampleContext';

export function SamplePage() {
  const t = useI18nContext();
  const history = useHistory();
  const [localState, setLocalState] = useState<number>(0);
  const { globalCounter, updateGlobalCounter } = useSample();

  const { counter: contextCounter, updateCounter: updateContextCounter } =
    useSampleContext();

  const handleLocalStateClick = useCallback(() => {
    setLocalState((prev) => prev + 1);
  }, [setLocalState]);

  const handleGlobalStateClick = useCallback(() => {
    updateGlobalCounter(1);
  }, [updateGlobalCounter]);

  const handleContextStateClick = useCallback(() => {
    updateContextCounter(1);
  }, [updateContextCounter]);

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
          Sample Page
        </Text>
      </Header>
      <Content alignItems={AlignItems.center} gap={2}>
        <Text marginBottom={1}>{`Local React State: ${localState}`}</Text>
        <Button
          onClick={handleLocalStateClick}
          textAlign={TextAlign.Center}
          marginBottom={6}
        >
          Update Local State
        </Button>
        <Text marginBottom={1}>{`Global Redux State: ${globalCounter}`}</Text>
        <Button
          onClick={handleGlobalStateClick}
          textAlign={TextAlign.Center}
          marginBottom={6}
        >
          Update Redux State
        </Button>
        <Text marginBottom={1}>{`React Context State: ${contextCounter}`}</Text>
        <Button
          onClick={handleContextStateClick}
          textAlign={TextAlign.Center}
          marginBottom={6}
        >
          Update Context State
        </Button>
      </Content>
    </Page>
  );
}
