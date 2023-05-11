import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventAccountImportType,
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  ButtonLink,
  Label,
  Text,
  FormTextField,
  TEXT_FIELD_SIZES,
  TEXT_FIELD_TYPES,
} from '../../../components/component-library';
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
import BottomButtons from './bottom-buttons';

export default function NewAAAccountImportForm() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { navigateToMostRecentOverviewPage } = useRouting();
  const [privateKey, setPrivateKey] = useState('');
  const [aaAddress, setAAAddress] = useState('');
  const warning = useSelector((state) => state.appState.warning);

  function importAccount(strategy, importArgs) {
    const loadingMessage = '';
    console.log('importAccount', strategy, importArgs, loadingMessage);

    dispatch(actions.importNewAccount(strategy, importArgs, loadingMessage))
      .then(({ selectedAddress }) => {
        if (selectedAddress) {
          trackImportEvent(strategy, true);
          dispatch(actions.hideWarning());
          navigateToMostRecentOverviewPage();
        } else {
          dispatch(actions.displayWarning(t('importAccountError')));
        }
      })
      .catch((error) => {
        console.log(error);
        trackImportEvent(strategy, error.message);
        translateWarning(error.message);
      });
  }

  function trackImportEvent(strategy, wasSuccessful) {
    const accountImportType =
      strategy === 'Private Key'
        ? MetaMetricsEventAccountImportType.PrivateKey
        : MetaMetricsEventAccountImportType.Json;

    const event = wasSuccessful
      ? MetaMetricsEventName.AccountAdded
      : MetaMetricsEventName.AccountAddFailed;

    trackEvent({
      category: MetaMetricsEventCategory.Accounts,
      event,
      properties: {
        account_type: MetaMetricsEventAccountType.Imported,
        account_import_type: accountImportType,
      },
    });
  }

  function getLoadingMessage(strategy) {
    if (strategy === 'JSON File') {
      return (
        <Text width={BLOCK_SIZES.THREE_FOURTHS} fontWeight={FONT_WEIGHT.BOLD}>
          <br />
          {t('importAccountJsonLoading1')}
          <br />
          <br />
          {t('importAccountJsonLoading2')}
        </Text>
      );
    }

    return '';
  }

  /**
   * @param {string} message - an Error/Warning message caught in importAccount()
   * This function receives a message that is a string like:
   * `t('importAccountErrorNotHexadecimal')`
   * `t('importAccountErrorIsSRP')`
   * `t('importAccountErrorNotAValidPrivateKey')`
   * and feeds it through useI18nContext
   */
  function translateWarning(message) {
    if (message && !message.startsWith('t(')) {
      // This is just a normal error message
      dispatch(actions.displayWarning(message));
    } else {
      // This is an error message in a form like
      // `t('importAccountErrorNotHexadecimal')`
      // so slice off the first 3 chars and last 2 chars, and feed to i18n
      dispatch(actions.displayWarning(t(message.slice(3, -2))));
    }
  }

  function handleKeyPress(event) {
    if (privateKey !== '' && event.key === 'Enter') {
      event.preventDefault();
      importAccount('Smart Contract', [privateKey, aaAddress, true]);
    }
  }

  return (
    <>
      <Box
        padding={4}
        className="bottom-border-1px" // There is no way to do just a bottom border in the Design System
        borderColor={BorderColor.borderDefault}
      >
        <Text variant={TextVariant.headingLg}>
          Import Account Abstraction Account
        </Text>
        <Text variant={TextVariant.bodySm} marginTop={2}>
          {
            'Imported Account Abstraction accounts won’t be associated with your MetaMask Secret Recovery Phrase. Learn more about imported accounts'
          }{' '}
          <ButtonLink
            size={Size.inherit}
            href={ZENDESK_URLS.IMPORTED_ACCOUNTS}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('here')}
          </ButtonLink>
        </Text>
        {/* <Text variant={TextVariant.bodySm} marginTop={2}>

         </Text> */}
      </Box>

      <Box padding={4} paddingBottom={8} paddingLeft={4} paddingRight={4}>
        <FormTextField
          id="private-key-box"
          size={TEXT_FIELD_SIZES.LARGE}
          autoFocus
          type={TEXT_FIELD_TYPES.TEXT}
          helpText={warning}
          error
          label="Account Abstraction Address"
          value={aaAddress}
          onChange={(event) => setAAAddress(event.target.value)}
          inputProps={{
            onKeyPress: handleKeyPress,
          }}
          marginBottom={4}
        />

        <FormTextField
          id="private-key-box"
          size={TEXT_FIELD_SIZES.LARGE}
          autoFocus
          type={TEXT_FIELD_TYPES.PASSWORD}
          helpText={warning}
          error
          label={t('pastePrivateKey')}
          value={privateKey}
          onChange={(event) => setPrivateKey(event.target.value)}
          inputProps={{
            onKeyPress: handleKeyPress,
          }}
          marginBottom={4}
        />

        <BottomButtons
          importAccountFunc={() =>
            importAccount('Smart Contract', [privateKey, aaAddress, true])
          }
          isPrimaryDisabled={privateKey === ''}
        />
      </Box>
    </>
  );
}
