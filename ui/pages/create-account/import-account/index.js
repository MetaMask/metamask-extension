import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import { ButtonLink, Label, Text } from '../../../components/component-library';
import Box from '../../../components/ui/box';
import Dropdown from '../../../components/ui/dropdown';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  BLOCK_SIZES,
  BorderColor,
  FONT_WEIGHT,
  JustifyContent,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRouting } from '../../../hooks/useRouting';
import * as actions from '../../../store/actions';

// Subviews
import JsonImportView from './json';
import PrivateKeyImportView from './private-key';

export default function NewAccountImportForm() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { navigateToMostRecentOverviewPage } = useRouting();

  const menuItems = [t('privateKey'), t('jsonFile')];

  const [type, setType] = useState(menuItems[0]);

  function importAccount(strategy, importArgs) {
    dispatch(actions.importNewAccount(strategy, importArgs))
      .then(({ selectedAddress, warningMessage }) => {
        if (warningMessage) {
          translateWarning(warningMessage);
        } else if (selectedAddress) {
          trackImportEvent(strategy, true);
          dispatch(actions.hideWarning());
          navigateToMostRecentOverviewPage();
        } else {
          dispatch(actions.displayWarning(t('importAccountError')));
          trackImportEvent(strategy, false);
        }
      })
      .catch((error) => translateWarning(error.message));
  }

  function trackImportEvent(strategy, wasSuccessful) {
    const account_import_type =
      strategy === 'Private Key'
        ? EVENT.ACCOUNT_IMPORT_TYPES.PRIVATE_KEY
        : EVENT.ACCOUNT_IMPORT_TYPES.JSON;

    const event = wasSuccessful
      ? EVENT_NAMES.ACCOUNT_ADDED
      : EVENT_NAMES.ACCOUNT_ADD_FAILED;

    trackEvent({
      category: EVENT.CATEGORIES.ACCOUNTS,
      event,
      properties: {
        account_type: EVENT.ACCOUNT_TYPES.IMPORTED,
        account_import_type,
      },
    });
  }

  /**
   * @param {string} message an Error/Warning message caught in importAccount()
   * This function receives a message that is a string like 't(importAccountErrorNotHexadecimal)'
   * and feeds it through useI18nContext
   */
  function translateWarning(message) {
    if (message && !message.startsWith('t(')) {
      // This is just a normal error message
      dispatch(actions.displayWarning(message));
    } else {
      // This is an error message in a form like
      // `t(importAccountErrorNotHexadecimal)`
      // so slice off the first 2 chars and last char, and feed to i18n
      dispatch(actions.displayWarning(t(message.slice(2, -1))));
    }
  }

  function PrivateKeyOrJson() {
    switch (type) {
      case menuItems[0]:
        return <PrivateKeyImportView importAccountFunc={importAccount} />;
      case menuItems[1]:
        return <JsonImportView importAccountFunc={importAccount} />;
    }
  }

  return (
    <>
      <Box
        padding={4}
        style={{ borderWidth: '0px 0px 1px 0px' }} // There is no way to do just a bottom border in the Design System
        borderColor={BorderColor.borderDefault}
      >
        <Text variant={TextVariant.headingLg}>{t('importAccount')}</Text>
        <Text variant={TextVariant.bodySm}>
          {t('importAccountMsg') + ' '}
          <ButtonLink size={Size.inherit} onClick={moreInfoLink}>
            {t('here')}
          </ButtonLink>
        </Text>
      </Box>

      <Box padding={8}>
        <Label
          width={BLOCK_SIZES.FULL}
          paddingBottom={4}
          justifyContent={JustifyContent.spaceBetween}
        >
          {t('selectType')}
          <Dropdown
            id="new-account-import-form__select"
            options={menuItems.map((text) => ({ value: text }))}
            selectedOption={type}
            onChange={(value) => {
              dispatch(actions.hideWarning());
              setType(value);
            }}
          />
        </Label>
        <PrivateKeyOrJson />
      </Box>
    </>
  );
}

export function moreInfoLink() {
  global.platform.openTab({
    url: ZENDESK_URLS.IMPORTED_ACCOUNTS,
  });
}

export function getLoadingMessage(strategy) {
  if (strategy === 'JSON File') {
    return (
      <Text width={BLOCK_SIZES.THREE_FOURTHS} fontWeight={FONT_WEIGHT.BOLD}>
        <br />
        Expect this JSON import to take a few minutes and freeze MetaMask.
        <br />
        <br />
        We apologize, and we will make it faster in the future.
      </Text>
    );
  }

  return '';
}
