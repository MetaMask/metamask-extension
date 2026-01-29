import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { getErrorMessage } from '../../../../shared/modules/error';
import {
  MetaMetricsEventAccountImportType,
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Box, ButtonLink, Label, Text } from '../../component-library';
import Dropdown from '../../ui/dropdown';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  BlockSize,
  FontWeight,
  JustifyContent,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import * as actions from '../../../store/actions';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { getIsSocialLoginFlow } from '../../../selectors';

// Subviews
import JsonImportView from './json';
import PrivateKeyImportView from './private-key';

export const ImportAccount = ({ onActionComplete }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  const menuItems = [t('privateKey'), t('jsonFile')];

  const [type, setType] = useState(menuItems[0]);
  const [importErrorMessage, setImportErrorMessage] = useState();

  async function importAccount(strategy, importArgs) {
    const loadingMessage = getLoadingMessage(strategy);

    try {
      if (isSocialLoginFlow) {
        const isPasswordOutdated = await dispatch(
          actions.checkIsSeedlessPasswordOutdated(true),
        );
        if (isPasswordOutdated) {
          return false;
        }
      }

      const { selectedAddress } = await dispatch(
        actions.importNewAccount(strategy, importArgs, loadingMessage),
      );
      if (selectedAddress) {
        trackImportEvent(strategy, true);
        setImportErrorMessage();
        onActionComplete(true);
      } else {
        setImportErrorMessage(t('importAccountError'));
        return false;
      }
    } catch (error) {
      const message = getErrorMessage(error);
      trackImportEvent(strategy, message);

      if (handleKeyringControllerError(error)) {
        return false;
      }

      translateWarning(message);
      return false;
    }

    return true;
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
        hd_entropy_index: hdEntropyIndex,
        is_suggested_name: true,
      },
    });
  }

  function getLoadingMessage(strategy) {
    if (strategy === 'json') {
      return (
        <>
          <Text width={BlockSize.ThreeFourths} fontWeight={FontWeight.Bold}>
            {t('importAccountJsonLoading1')}
          </Text>
          <Text width={BlockSize.ThreeFourths} fontWeight={FontWeight.Bold}>
            {t('importAccountJsonLoading2')}
          </Text>
        </>
      );
    }

    return '';
  }

  /**
   * @param message - an Error/Warning message caught in importAccount()
   * This function receives a message that is a string like:
   * `t('importAccountErrorNotHexadecimal')`
   * `t('importAccountErrorIsSRP')`
   * `t('importAccountErrorNotAValidPrivateKey')`
   * and feeds it through useI18nContext
   */
  function translateWarning(message) {
    if (message && !message.startsWith('t(')) {
      // This is just a normal error message
      setImportErrorMessage(message);
    } else {
      // This is an error message in a form like
      // `t('importAccountErrorNotHexadecimal')`
      // so slice off the first 3 chars and last 2 chars, and feed to i18n
      setImportErrorMessage(t(message.slice(3, -2)));
    }
  }

  function handleKeyringControllerError(error) {
    // This is not the best way to handle error messages coming from the KeyringController.
    // We should have a mapping that allows us to map error codes to i18n messages.
    // However, for now, we will just check if the error message starts with
    // 'KeyringController -' and if so, we will trim that part and translate
    // the rest of the message.
    const errorPrefix = 'KeyringController -';
    if (error.message.startsWith(errorPrefix)) {
      const trimmedMessage = error.message.slice(errorPrefix.length).trim();
      translateWarning(trimmedMessage);
      return true;
    }

    return false;
  }

  return (
    <>
      {isSocialLoginFlow ? (
        <>
          <Text variant={TextVariant.bodySm}>
            {t('importAccountWithSocialMsg')}
          </Text>
          <Text variant={TextVariant.bodySm}>
            {t('importAccountWithSocialMsgLearnMore', [
              <ButtonLink
                size={Size.inherit}
                href={ZENDESK_URLS.IMPORTED_ACCOUNTS_PRIVATE_KEY}
                target="_blank"
                rel="noopener noreferrer"
                key="importAccountWithSocialMsgLearnMore"
              >
                {t('learnMoreUpperCase')}
              </ButtonLink>,
            ])}
          </Text>
        </>
      ) : (
        <Text variant={TextVariant.bodySm} marginTop={2}>
          {t('importAccountMsg')}{' '}
          <ButtonLink
            size={Size.inherit}
            href={ZENDESK_URLS.IMPORTED_ACCOUNTS_PRIVATE_KEY}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('here')}
          </ButtonLink>
        </Text>
      )}
      <Box paddingTop={4} paddingBottom={8}>
        <Label
          width={BlockSize.Full}
          marginBottom={4}
          justifyContent={JustifyContent.spaceBetween}
        >
          {t('selectType')}
          <Dropdown
            options={menuItems.map((text) => ({ value: text }))}
            selectedOption={type}
            onChange={(value) => {
              setImportErrorMessage();
              setType(value);
            }}
          />
        </Label>
        {type === menuItems[0] ? (
          <PrivateKeyImportView
            importAccountFunc={importAccount}
            onActionComplete={(confirmed) => {
              setImportErrorMessage();
              onActionComplete(confirmed);
            }}
            importErrorMessage={importErrorMessage}
          />
        ) : (
          <JsonImportView
            importAccountFunc={importAccount}
            onActionComplete={(confirmed) => {
              setImportErrorMessage();
              onActionComplete(confirmed);
            }}
            importErrorMessage={importErrorMessage}
          />
        )}
      </Box>
    </>
  );
};

ImportAccount.propTypes = {
  /**
   * Executes when the key is imported
   */
  onActionComplete: PropTypes.func.isRequired,
};
