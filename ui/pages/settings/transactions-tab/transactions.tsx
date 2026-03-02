import React, { useContext, useEffect, useMemo } from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  SECURITY_ALERTS_LEARN_MORE_LINK,
  TRANSACTION_SIMULATIONS_LEARN_MORE_LINK,
} from '../../../../shared/lib/ui-utils';
import { SMART_TRANSACTIONS_LEARN_MORE_URL } from '../../../../shared/constants/smartTransactions';
import { ButtonLink, ButtonLinkSize } from '../../../components/component-library';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useDispatch, useSelector } from 'react-redux';
import {
  setUseTransactionSimulations,
  setUseExternalNameSources,
  setSecurityAlertsEnabled,
  setFeatureFlag,
  setSmartTransactionsPreferenceEnabled,
  setDismissSmartAccountSuggestionEnabled,
  setSmartAccountRequestsFromDapps,
} from '../../../store/actions';
import { getIsSecurityAlertsEnabled } from '../../../selectors';
import { getIsActiveShieldSubscription } from '../../../selectors/subscription';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/modules/selectors';
import { getPreferences } from '../../../selectors';

export default function Transactions(): React.ReactElement {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const securityAlertsEnabled = useSelector(getIsSecurityAlertsEnabled);
  const smartTransactionsEnabled = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );
  const hasActiveShieldSubscription = useSelector(
    getIsActiveShieldSubscription,
  );

  const preferences = useSelector(getPreferences);
  const metamask = useSelector(
    (state: {
      metamask: {
        useExternalNameSources?: boolean;
        useTransactionSimulations?: boolean;
        featureFlags?: { sendHexData?: boolean };
      };
    }) => state.metamask,
  );
  const useExternalNameSources = metamask?.useExternalNameSources;
  const useTransactionSimulations = metamask?.useTransactionSimulations;
  const sendHexData = metamask?.featureFlags?.sendHexData ?? false;

  const dismissSmartAccountSuggestionEnabled = Boolean(
    preferences?.dismissSmartAccountSuggestionEnabled,
  );
  const smartAccountRequestsFromDapps = Boolean(
    preferences?.smartAccountRequestsFromDapps,
  );

  const n = getNumberOfSettingRoutesInTab(t, t('transactions'));
  const settingsRefs = useMemo(
    () =>
      Array.from({ length: n }, () =>
        React.createRef<HTMLDivElement>(),
      ) as React.RefObject<HTMLDivElement>[],
    [n],
  );

  useEffect(() => {
    handleSettingsRefs(t, t('transactions'), settingsRefs);
  }, [t, settingsRefs]);

  const handleSecurityAlertToggle = (oldValue: boolean) => {
    const newValue = !oldValue;
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        blockaid_alerts_enabled: newValue,
      },
    });
    dispatch(setSecurityAlertsEnabled(newValue));
  };

  return (
    <Box
      paddingHorizontal={4}
      paddingBottom={4}
      className="settings-page__body"
    >
      {/* Estimate balance changes */}
      <Box ref={settingsRefs[0]} flexDirection={BoxFlexDirection.Column} gap={1} marginTop={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('simulationsSettingSubHeader')}
          </Text>
          <div data-testid="useTransactionSimulations">
            <ToggleButton
              value={Boolean(useTransactionSimulations)}
              onToggle={(value: boolean) =>
                dispatch(setUseTransactionSimulations(!value))
              }
              offLabel={t('off')}
              onLabel={t('on')}
              disabled={hasActiveShieldSubscription}
            />
          </div>
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('simulationsSettingDescription', [
            <a
              key="learn_more_link"
              href={TRANSACTION_SIMULATIONS_LEARN_MORE_LINK}
              rel="noreferrer"
              target="_blank"
            >
              {t('learnMoreUpperCase')}
            </a>,
          ])}
        </Text>
      </Box>

      {/* Security alerts */}
      <Box ref={settingsRefs[1]} flexDirection={BoxFlexDirection.Column} gap={1} marginTop={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('securityAlerts')}
          </Text>
          <div data-testid="securityAlert">
            <ToggleButton
              value={securityAlertsEnabled}
              onToggle={handleSecurityAlertToggle}
              offLabel={t('off')}
              onLabel={t('on')}
              disabled={hasActiveShieldSubscription}
            />
          </div>
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('securityAlertsDescription', [
            <a
              key="learn_more_link"
              href={SECURITY_ALERTS_LEARN_MORE_LINK}
              rel="noreferrer"
              target="_blank"
            >
              {t('learnMoreUpperCase')}
            </a>,
          ])}
        </Text>
      </Box>

      {/* Smart Transactions */}
      <Box
        ref={settingsRefs[2]}
        flexDirection={BoxFlexDirection.Column}
        gap={1}
        marginTop={4}
        data-testid="advanced-setting-enable-smart-transactions"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('smartTransactions')}
          </Text>
          <ToggleButton
            value={smartTransactionsEnabled}
            onToggle={(oldValue: boolean) =>
              dispatch(setSmartTransactionsPreferenceEnabled(!oldValue))
            }
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="settings-page-stx-opt-in-toggle"
          />
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('stxOptInSupportedNetworksDescription', [
            <ButtonLink
              key="learn_more"
              as="a"
              href={SMART_TRANSACTIONS_LEARN_MORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              size={ButtonLinkSize.Inherit}
            >
              {t('learnMoreUpperCase')}
            </ButtonLink>,
          ])}
        </Text>
      </Box>

      {/* Smart account requests from dapps */}
      <Box
        ref={settingsRefs[3]}
        flexDirection={BoxFlexDirection.Column}
        gap={1}
        marginTop={4}
        data-testid="settings-smart-account-requests-from-dapps"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('smartAccountRequestsFromDapps')}
          </Text>
          <ToggleButton
            value={Boolean(smartAccountRequestsFromDapps)}
            onToggle={(oldValue: boolean) =>
              dispatch(setSmartAccountRequestsFromDapps(!oldValue))
            }
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="settings-page-smart-account-requests-from-dapps-toggle"
          />
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('smartAccountRequestsFromDappsDescription')}
        </Text>
      </Box>

      {/* Proposed nicknames */}
      <Box ref={settingsRefs[4]} flexDirection={BoxFlexDirection.Column} gap={1} marginTop={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('externalNameSourcesSetting')}
          </Text>
          <div data-testid="useExternalNameSources">
            <ToggleButton
              value={Boolean(useExternalNameSources)}
              onToggle={(value: boolean) =>
                dispatch(setUseExternalNameSources(!value))
              }
              offLabel={t('off')}
              onLabel={t('on')}
            />
          </div>
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('externalNameSourcesSettingDescription')}
        </Text>
      </Box>

      {/* Show hex data */}
      <Box
        ref={settingsRefs[5]}
        flexDirection={BoxFlexDirection.Column}
        gap={1}
        marginTop={4}
        data-testid="advanced-setting-hex-data"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('showHexData')}
          </Text>
          <ToggleButton
            value={sendHexData}
            onToggle={(value: boolean) =>
              dispatch(setFeatureFlag('sendHexData', !value, ''))
            }
            offLabel={t('off')}
            onLabel={t('on')}
            className="hex-data-toggle"
          />
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('showHexDataDescription')}
        </Text>
      </Box>

      {/* Customize transaction nonce (info only) */}
      <Box ref={settingsRefs[6]} flexDirection={BoxFlexDirection.Column} gap={1} marginTop={4}>
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('customizeTransactionNonce')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('customizeTransactionNonceDescription')}
        </Text>
      </Box>

      {/* Dismiss Smart Account suggestion */}
      <Box
        ref={settingsRefs[7]}
        flexDirection={BoxFlexDirection.Column}
        gap={1}
        marginTop={4}
        data-testid="advanced-setting-dismiss-smart-account-suggestion-enabled"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('dismissSmartAccountSuggestionEnabledTitle')}
          </Text>
          <ToggleButton
            value={Boolean(dismissSmartAccountSuggestionEnabled)}
            onToggle={(oldValue: boolean) =>
              dispatch(
                setDismissSmartAccountSuggestionEnabled(!oldValue),
              )
            }
            offLabel={t('off')}
            onLabel={t('on')}
            dataTestId="settings-page-dismiss-smart-account-suggestion-enabled-toggle"
          />
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('dismissSmartAccountSuggestionEnabledDescription')}
        </Text>
      </Box>
    </Box>
  );
}
