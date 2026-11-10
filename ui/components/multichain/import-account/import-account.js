import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getErrorMessage } from '../../../../shared/lib/error';
import {
  MetaMetricsEventAccountImportType,
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import * as actions from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { getIsSocialLoginFlow } from '../../../selectors';

// Subviews
import JsonImportView from './json';
import PrivateKeyImportView from './private-key';

export const ImportAccount = ({ onActionComplete }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  const importTypes = [
    { id: 'privateKey', label: t('privateKey') },
    { id: 'json', label: t('jsonFile') },
  ];

  const [type, setType] = useState(importTypes[0].id);
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

      const {
        internalAccounts: { selectedAccount },
      } = await dispatch(
        actions.importNewAccount(strategy, importArgs, loadingMessage),
      );
      if (selectedAccount) {
        trackImportEvent(strategy, true);
        setImportErrorMessage();
        onActionComplete(true);
      } else {
        setImportErrorMessage(t('importAccountError'));
        return false;
      }
    } catch (error) {
      const message = getErrorMessage(error);
      trackImportEvent(strategy, false);

      // A V3 keystore reports a failed MAC check as a passphrase error for both
      // a missing password and a wrong one, so there is no code to match on.
      if (strategy === 'json' && message.includes('passphrase')) {
        setImportErrorMessage(t('jsonImportPasswordError'));
        return false;
      }

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
      strategy === 'privateKey'
        ? MetaMetricsEventAccountImportType.PrivateKey
        : MetaMetricsEventAccountImportType.Json;

    const event = wasSuccessful
      ? MetaMetricsEventName.AccountAdded
      : MetaMetricsEventName.AccountAddFailed;

    trackEvent(
      createEventBuilder(event)
        .addCategory(MetaMetricsEventCategory.Accounts)
        .addProperties({
          account_type: MetaMetricsEventAccountType.Imported,
          account_import_type: accountImportType,
          hd_entropy_index: hdEntropyIndex,
          is_suggested_name: true,
        })
        .build(),
    );
  }

  function getLoadingMessage(strategy) {
    if (strategy === 'json') {
      return (
        <>
          <Text className="w-3/4" fontWeight={FontWeight.Bold}>
            {t('importAccountJsonLoading1')}
          </Text>
          <Text className="w-3/4" fontWeight={FontWeight.Bold}>
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
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="h-full">
      {isSocialLoginFlow ? (
        <>
          <Text variant={TextVariant.BodySm}>
            {t('importAccountWithSocialMsg')}
          </Text>
          <Text variant={TextVariant.BodySm}>
            {t('importAccountWithSocialMsgLearnMore', [
              <TextButton
                size="body-sm"
                asChild
                className="inline"
                key="importAccountWithSocialMsgLearnMore"
              >
                <a
                  href={ZENDESK_URLS.IMPORTED_ACCOUNTS_PRIVATE_KEY}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('learnMoreUpperCase')}
                </a>
              </TextButton>,
            ])}
          </Text>
        </>
      ) : (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="mt-2"
        >
          {t('importAccountMsg')}{' '}
          <TextButton size="body-md" asChild className="inline">
            <a
              href={ZENDESK_URLS.IMPORTED_ACCOUNTS_PRIVATE_KEY}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMoreUpperCase')}
            </a>
          </TextButton>
        </Text>
      )}
      {/* Network select stays hidden until a non-EVM import exists. */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        borderColor={BoxBorderColor.BorderMuted}
        borderWidth={1}
        padding={1}
        className="w-fit rounded-lg"
        role="group"
        aria-label={t('selectType')}
        data-testid="import-account-type-toggle"
      >
        {importTypes.map(({ id, label }) => {
          const isSelected = type === id;

          return (
            <button
              type="button"
              key={id}
              aria-pressed={isSelected}
              className={`rounded-lg px-4 py-1 ${
                isSelected ? 'bg-muted' : 'bg-transparent'
              }`}
              data-testid={`import-account-type-${id}`}
              onClick={() => {
                setImportErrorMessage();
                setType(id);
              }}
            >
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={
                  isSelected ? TextColor.TextDefault : TextColor.TextAlternative
                }
              >
                {label}
              </Text>
            </button>
          );
        })}
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} className="min-h-0 flex-1">
        {type === importTypes[0].id ? (
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
            onClearImportError={() => setImportErrorMessage()}
            importErrorMessage={importErrorMessage}
          />
        )}
      </Box>
    </Box>
  );
};

ImportAccount.propTypes = {
  /**
   * Executes when the key is imported
   */
  onActionComplete: PropTypes.func.isRequired,
};
