import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import classnames from 'clsx';
import {
  Box,
  Text,
  IconName,
  AvatarNetwork,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconSize,
  TextColor,
  TextVariant,
  IconColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  TextButton,
  TextAlign,
} from '@metamask/design-system-react';
import { addUrlProtocolPrefix } from '../../../../shared/lib/url-utils';
import { useOnboardingSearchParams } from '../hooks/useOnboardingSearchParams';
import { TextField } from '../../../components/component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  COINGECKO_LINK,
  CRYPTOCOMPARE_LINK,
  PRIVACY_POLICY_LINK,
  TRANSACTION_SIMULATIONS_LEARN_MORE_LINK,
} from '../../../../shared/lib/ui-utils';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { getIsBasicFunctionalityConsolidationEnabledInBuild } from '../../../../shared/lib/environment';
import { getIsBasicFunctionalityForcedOnDuringOnboarding } from '../../../selectors/multichain/basic-functionality';

import { useAnalytics } from '../../../hooks/useAnalytics';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getUseExternalNameSources,
  getExternalServicesOnboardingToggleState,
  getIsSocialLoginFlow,
} from '../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import {
  setIpfsGateway,
  setUseCurrencyRateCheck,
  setUseMultiAccountBalanceChecker,
  setUse4ByteResolution,
  setUseTokenDetection,
  setUseAddressBarEnsResolution,
  toggleNetworkMenu,
  setUseTransactionSimulations,
  setUseExternalNameSources,
  setEditedNetwork,
} from '../../../store/actions';
import {
  onboardingToggleBasicFunctionalityOn,
  openBasicFunctionalityModal,
} from '../../../ducks/app/app';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  IPFS_FORBIDDEN_GATEWAYS,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { BackupAndSyncToggle } from '../../../components/app/identity/backup-and-sync-toggle/backup-and-sync-toggle';
import MetametricsToggle from '../../../components/app/metametrics-toggle/metametrics-toggle';
import type { MetaMaskReduxState } from '../../../store/types';
import { useDispatch } from '../../../store/hooks';
import { Setting } from './setting';

const ANIMATION_TIME = 500;
const IPFS_GATEWAY_ERROR_ID = 'onboarding-ipfs-gateway-error';

type SettingsCategory = {
  id: 'privacy' | 'backup-and-sync' | 'networks';
  title: string;
};

export default function PrivacySettings() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SettingsCategory | null>(
    null,
  );
  const [hiddenClass, setHiddenClass] = useState(true);

  const defaultState = useSelector(
    (state: MetaMaskReduxState) => state.metamask,
  );
  const {
    use4ByteResolution,
    useTokenDetection,
    useCurrencyRateCheck,
    useMultiAccountBalanceChecker,
    ipfsGateway,
    useAddressBarEnsResolution,
    useTransactionSimulations,
  } = defaultState;
  const useExternalNameSources = useSelector(getUseExternalNameSources);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const isBasicFunctionalityConsolidationEnabled =
    getIsBasicFunctionalityConsolidationEnabledInBuild();
  const isBasicFunctionalityForcedOn = useSelector(
    getIsBasicFunctionalityForcedOnDuringOnboarding,
  );
  const [turnOn4ByteResolution, setTurnOn4ByteResolution] =
    useState(use4ByteResolution);
  const [turnOnTokenDetection, setTurnOnTokenDetection] =
    useState(useTokenDetection);
  const [turnOnCurrencyRateCheck, setTurnOnCurrencyRateCheck] =
    useState(useCurrencyRateCheck);

  const [
    isMultiAccountBalanceCheckerEnabled,
    setMultiAccountBalanceCheckerEnabled,
  ] = useState(useMultiAccountBalanceChecker);
  const [isTransactionSimulationsEnabled, setTransactionSimulationsEnabled] =
    useState(useTransactionSimulations);
  const [ipfsURL, setIPFSURL] = useState(ipfsGateway);
  const [ipfsError, setIPFSError] = useState(null);
  const [addressBarResolution, setAddressBarResolution] = useState(
    useAddressBarEnsResolution,
  );
  const [turnOnExternalNameSources, setTurnOnExternalNameSources] = useState(
    useExternalNameSources,
  );

  const { trackEvent, createEventBuilder } = useAnalytics();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const { isFromReminder } = useOnboardingSearchParams();

  const handleSubmit = () => {
    // When consolidation is on, child prefs are owned by Basic Functionality
    // and applied at onboarding completion via toggleBasicFunctionality.
    if (!isBasicFunctionalityConsolidationEnabled) {
      dispatch(setUse4ByteResolution(turnOn4ByteResolution));
      dispatch(setUseTokenDetection(turnOnTokenDetection));
      dispatch(
        setUseMultiAccountBalanceChecker(isMultiAccountBalanceCheckerEnabled),
      );
      dispatch(setUseCurrencyRateCheck(turnOnCurrencyRateCheck));
      dispatch(setUseAddressBarEnsResolution(addressBarResolution));
      setUseTransactionSimulations(isTransactionSimulationsEnabled);
      setUseExternalNameSources(turnOnExternalNameSources);
    }

    if (ipfsURL && !ipfsError) {
      const { host } = new URL(addUrlProtocolPrefix(ipfsURL) as string);
      dispatch(setIpfsGateway(host));
    }

    trackEvent(
      createEventBuilder(MetaMetricsEventName.SettingsUpdated)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          settings_group: 'onboarding_advanced_configuration',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_profile_syncing_enabled: isBackupAndSyncEnabled,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_basic_functionality_enabled: externalServicesOnboardingToggleState,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          turnon_token_detection: isBasicFunctionalityConsolidationEnabled
            ? externalServicesOnboardingToggleState
            : turnOnTokenDetection,
        })
        .build(),
    );
    if (isFromReminder) {
      navigate(`${ONBOARDING_COMPLETION_ROUTE}?isFromReminder=true`, {
        replace: true,
      });
    } else {
      navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
    }
  };

  const handleIPFSChange = (url: string) => {
    setIPFSURL(url);
    try {
      const { host } = new URL(addUrlProtocolPrefix(url) as string);
      if (!host || IPFS_FORBIDDEN_GATEWAYS.includes(host)) {
        throw new Error();
      }
      setIPFSError(null);
    } catch (error) {
      setIPFSError(t('onboardingAdvancedPrivacyIPFSInvalid'));
    }
  };

  const handleItemSelected = (item: SettingsCategory) => {
    setSelectedItem(item);
    setShowDetail(true);

    setTimeout(() => {
      setHiddenClass(false);
    }, ANIMATION_TIME);
  };

  const handleBack = () => {
    setShowDetail(false);
    setTimeout(() => {
      setHiddenClass(true);
    }, ANIMATION_TIME);
  };

  const items: SettingsCategory[] = [
    {
      id: 'privacy',
      title: t('privacy'),
    },
    {
      id: 'backup-and-sync',
      title: t('backupAndSync'),
    },
    {
      id: 'networks',
      title: t('networks'),
    },
  ];

  return (
    <>
      <Box
        className="privacy-settings"
        data-testid="parent-selector-onboarding-privacy-settings"
      >
        <Box
          className={classnames('container', {
            'show-detail': showDetail,
            'show-list': !showDetail,
          })}
        >
          <Box className="list-view">
            <Box
              className="privacy-settings__header"
              marginTop={2}
              marginBottom={6}
              flexDirection={BoxFlexDirection.Column}
              justifyContent={BoxJustifyContent.Start}
            >
              <Box
                alignItems={BoxAlignItems.Center}
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
              >
                <ButtonIcon
                  iconName={IconName.ArrowLeft}
                  ariaLabel="Back"
                  size={ButtonIconSize.Md}
                  data-testid="privacy-settings-back-button"
                  onClick={handleSubmit}
                />
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  justifyContent={BoxJustifyContent.Center}
                  className="w-full"
                >
                  <Text
                    variant={TextVariant.HeadingSm}
                    textAlign={TextAlign.Center}
                  >
                    {t('defaultSettingsTitle')}
                  </Text>
                </Box>
                <Box className="privacy-settings__empty-space" />
              </Box>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                className="mt-4"
              >
                {t('defaultSettingsSubTitle')}
              </Text>
              <TextButton asChild className="mt-1 self-start">
                <a
                  href={ZENDESK_URLS.PRIVACY_BEST_PRACTICES}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('learnMoreAboutPrivacy')}
                </a>
              </TextButton>
            </Box>
            <Box>
              <Box
                className="privacy-settings__categories-list list-none"
                gap={6}
                flexDirection={BoxFlexDirection.Column}
                asChild
              >
                <ul>
                  {items.map((item) => (
                    <Box
                      asChild
                      key={item.id}
                      className="categories-item w-full border-0 bg-transparent p-0 text-left"
                    >
                      <button
                        type="button"
                        aria-label={item.title}
                        data-testid={`category-item-${item.title}`}
                        onClick={() => handleItemSelected(item)}
                      >
                        <Box
                          flexDirection={BoxFlexDirection.Row}
                          alignItems={BoxAlignItems.Start}
                          justifyContent={BoxJustifyContent.Between}
                        >
                          <Text
                            variant={TextVariant.BodyMd}
                            fontWeight={FontWeight.Medium}
                          >
                            {item.title}
                          </Text>
                          <Icon
                            name={IconName.ArrowRight}
                            size={IconSize.Md}
                            color={IconColor.IconDefault}
                            aria-hidden
                          />
                        </Box>
                      </button>
                    </Box>
                  ))}
                </ul>
              </Box>
            </Box>
          </Box>

          <Box
            className={classnames('detail-view', {
              hidden: !showDetail && hiddenClass,
            })}
          >
            <Box
              className="privacy-settings__header"
              marginTop={2}
              marginBottom={4}
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <ButtonIcon
                data-testid="category-back-button"
                iconName={IconName.ArrowLeft}
                ariaLabel="Back"
                size={ButtonIconSize.Md}
                onClick={handleBack}
              />
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Center}
                className="w-full"
              >
                <Text
                  variant={TextVariant.HeadingSm}
                  textAlign={TextAlign.Center}
                >
                  {selectedItem?.title}
                </Text>
              </Box>
              <Box className="privacy-settings__empty-space" />
            </Box>

            <Box
              className="privacy-settings__settings"
              data-testid="privacy-settings-settings"
            >
              {selectedItem?.id === 'privacy' ? (
                <>
                  <Box className="w-full" marginBottom={3}>
                    <Setting
                      dataTestId="basic-functionality-toggle"
                      value={externalServicesOnboardingToggleState}
                      disabled={isBasicFunctionalityForcedOn}
                      setValue={(toggledValue) => {
                        if (isBasicFunctionalityForcedOn) {
                          return;
                        }
                        if (toggledValue) {
                          dispatch(onboardingToggleBasicFunctionalityOn());
                          trackEvent(
                            createEventBuilder(
                              MetaMetricsEventName.SettingsUpdated,
                            )
                              .addCategory(MetaMetricsEventCategory.Onboarding)
                              .addProperties({
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                settings_group:
                                  'onboarding_advanced_configuration',
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                settings_type: 'basic_functionality',
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                old_value: false,
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                new_value: true,
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                was_profile_syncing_on: false,
                              })
                              .build(),
                          );
                        } else {
                          dispatch(openBasicFunctionalityModal());
                        }
                      }}
                      title={t('basicConfigurationLabel')}
                      description={t('basicConfigurationDescription', [
                        <a
                          href="https://metamask.com/privacy-notice"
                          key="link"
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {t('privacyMsg')}
                        </a>,
                      ])}
                    />
                  </Box>

                  <Setting
                    title={t('onboardingAdvancedPrivacyIPFSTitle')}
                    showToggle={false}
                    description={
                      <>
                        {t('onboardingAdvancedPrivacyIPFSDescription')}
                        <Box paddingTop={2}>
                          <TextField
                            value={ipfsURL}
                            style={{ width: '100%' }}
                            inputProps={{
                              'data-testid': 'ipfs-input',
                              ...(ipfsError
                                ? {
                                    'aria-invalid': true,
                                    'aria-describedby': IPFS_GATEWAY_ERROR_ID,
                                  }
                                : {}),
                            }}
                            onChange={(e) => {
                              handleIPFSChange(e.target.value);
                            }}
                          />
                          {ipfsError ? (
                            <Text
                              variant={TextVariant.BodyMd}
                              color={TextColor.ErrorDefault}
                              asChild
                            >
                              <p id={IPFS_GATEWAY_ERROR_ID}>{ipfsError}</p>
                            </Text>
                          ) : null}
                        </Box>
                      </>
                    }
                  />
                  {!isBasicFunctionalityConsolidationEnabled && (
                    <Box
                      data-testid="legacy-basic-functionality-settings"
                      flexDirection={BoxFlexDirection.Column}
                    >
                      <Setting
                        value={turnOnTokenDetection}
                        setValue={setTurnOnTokenDetection}
                        title={t('turnOnTokenDetection')}
                        description={t('useTokenDetectionPrivacyDesc')}
                      />
                      <Setting
                        value={isTransactionSimulationsEnabled}
                        setValue={setTransactionSimulationsEnabled}
                        title={t('simulationsSettingSubHeader')}
                        description={t('simulationsSettingDescription', [
                          <a
                            key="learn_more_link"
                            href={TRANSACTION_SIMULATIONS_LEARN_MORE_LINK}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t('learnMoreUpperCase')}
                          </a>,
                        ])}
                      />
                      <Setting
                        value={turnOnCurrencyRateCheck}
                        setValue={setTurnOnCurrencyRateCheck}
                        title={t('currencyRateCheckToggle')}
                        dataTestId="currency-rate-check-toggle"
                        description={t('currencyRateCheckToggleDescription', [
                          <a
                            key="coingecko_link"
                            href={COINGECKO_LINK}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t('coingecko')}
                          </a>,
                          <a
                            key="cryptocompare_link"
                            href={CRYPTOCOMPARE_LINK}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t('cryptoCompare')}
                          </a>,
                          <a
                            key="privacy_policy_link"
                            href={PRIVACY_POLICY_LINK}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t('privacyMsg')}
                          </a>,
                        ])}
                      />
                      <Setting
                        value={addressBarResolution}
                        setValue={setAddressBarResolution}
                        title={t('ensDomainsSettingTitle')}
                        description={
                          <>
                            <Text
                              variant={TextVariant.BodyMd}
                              color={TextColor.TextAlternative}
                            >
                              {t('ensDomainsSettingDescriptionIntroduction')}
                            </Text>
                            <Box
                              marginTop={4}
                              marginBottom={4}
                              className="pl-4"
                              style={{ listStyleType: 'circle' }}
                              asChild
                            >
                              <ul>
                                <Text
                                  variant={TextVariant.BodyMd}
                                  asChild
                                  color={TextColor.TextAlternative}
                                >
                                  <li>
                                    {t('ensDomainsSettingDescriptionPart1')}
                                  </li>
                                </Text>
                                <Text
                                  variant={TextVariant.BodyMd}
                                  asChild
                                  color={TextColor.TextAlternative}
                                >
                                  <li>
                                    {t('ensDomainsSettingDescriptionPart2')}
                                  </li>
                                </Text>
                              </ul>
                            </Box>
                            <Text
                              variant={TextVariant.BodyMd}
                              color={TextColor.TextAlternative}
                            >
                              {t('ensDomainsSettingDescriptionOutroduction')}
                            </Text>
                          </>
                        }
                      />
                      <Setting
                        value={isMultiAccountBalanceCheckerEnabled}
                        setValue={setMultiAccountBalanceCheckerEnabled}
                        title={t('useMultiAccountBalanceChecker')}
                        description={t(
                          'useMultiAccountBalanceCheckerSettingDescription',
                        )}
                      />
                      <Setting
                        value={turnOn4ByteResolution}
                        setValue={setTurnOn4ByteResolution}
                        title={t('use4ByteResolution')}
                        description={t('toggleDecodeDescription')}
                      />
                      <Setting
                        value={turnOnExternalNameSources}
                        setValue={setTurnOnExternalNameSources}
                        title={t('externalNameSourcesSetting')}
                        description={t('externalNameSourcesSettingDescription')}
                      />
                    </Box>
                  )}
                  {isSocialLoginFlow && (
                    <MetametricsToggle fromDefaultSettings />
                  )}
                </>
              ) : null}
              {selectedItem?.id === 'backup-and-sync' ? (
                <BackupAndSyncToggle isOnboarding />
              ) : null}
              {selectedItem?.id === 'networks' ? (
                <Setting
                  title={t('onboardingAdvancedPrivacyNetworkTitle')}
                  showToggle={false}
                  enableMarginBottom={false}
                  description={
                    <>
                      {t('onboardingAdvancedPrivacyNetworkDescription', [
                        <a
                          href="https://metamask.com/privacy-notice"
                          key="privacy-policy-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('privacyMsg')}
                        </a>,
                        <a
                          href={ZENDESK_URLS.ADD_SOLANA_ACCOUNTS}
                          key="add-solana-accounts-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t(
                            'onboardingAdvancedPrivacyNetworkDescriptionCallToAction',
                          )}
                        </a>,
                      ])}

                      <Box paddingTop={4}>
                        <Box flexDirection={BoxFlexDirection.Column} gap={5}>
                          {Object.values(networkConfigurations)
                            .filter(
                              ({ chainId }) => !TEST_CHAINS.includes(chainId),
                            )
                            .map((network) => (
                              <Box
                                asChild
                                key={network.chainId}
                                className="privacy-settings__customizable-network w-full border-0 bg-transparent p-0 text-left"
                              >
                                <button
                                  type="button"
                                  aria-label={network.name}
                                  onClick={() => {
                                    dispatch(
                                      setEditedNetwork({
                                        chainId: network.chainId,
                                      }),
                                    );
                                    dispatch(toggleNetworkMenu());
                                  }}
                                >
                                  <Box
                                    flexDirection={BoxFlexDirection.Row}
                                    alignItems={BoxAlignItems.Center}
                                    justifyContent={BoxJustifyContent.Between}
                                    className="w-full"
                                  >
                                    <Box
                                      flexDirection={BoxFlexDirection.Row}
                                      alignItems={BoxAlignItems.Center}
                                    >
                                      <AvatarNetwork
                                        src={
                                          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                                            network.chainId
                                          ]
                                        }
                                        name={network.name}
                                      />
                                      <Box className="text-left" marginLeft={3}>
                                        <Text
                                          variant={TextVariant.BodyMd}
                                          fontWeight={FontWeight.Medium}
                                        >
                                          {network.name}
                                        </Text>
                                        <Text
                                          variant={TextVariant.BodyMd}
                                          color={TextColor.TextAlternative}
                                        >
                                          {
                                            // Get just the protocol + domain, not the infura key in path
                                            new URL(
                                              network?.rpcEndpoints[
                                                network?.defaultRpcEndpointIndex
                                              ]?.url,
                                            )?.origin
                                          }
                                        </Text>
                                      </Box>
                                    </Box>
                                    <Icon
                                      name={IconName.ArrowRight}
                                      size={IconSize.Md}
                                      color={IconColor.IconDefault}
                                      aria-hidden
                                    />
                                  </Box>
                                </button>
                              </Box>
                            ))}
                          <TextButton
                            onClick={() => {
                              dispatch(
                                toggleNetworkMenu({
                                  isAddingNewNetwork: true,
                                }),
                              );
                            }}
                            className="justify-start flex"
                          >
                            <Box
                              flexDirection={BoxFlexDirection.Row}
                              alignItems={BoxAlignItems.Center}
                            >
                              <Icon name={IconName.Add} className="mr-3" />
                              <Text>{t('addANetwork')}</Text>
                            </Box>
                          </TextButton>
                        </Box>
                      </Box>
                    </>
                  }
                />
              ) : null}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
