import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { TransactionController } from '@metamask/transaction-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getBridgeStatusControllerMessenger,
  BridgeStatusControllerMessenger,
} from './messengers';
import { BridgeStatusControllerInit } from './bridge-status-controller-init';

jest.mock('@metamask/bridge-status-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<BridgeStatusControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBridgeStatusControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('BridgeStatusControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = BridgeStatusControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(BridgeStatusController);
  });

  it('passes the proper arguments to the controller', () => {
    BridgeStatusControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeStatusController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      clientId: 'extension',
      state: undefined,
      config: {
        customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      },
      addTransactionFn: expect.any(Function),
      addTransactionBatchFn: expect.any(Function),
      updateTransactionFn: expect.any(Function),
      estimateGasFeeFn: expect.any(Function),
      fetchFn: expect.any(Function),
      traceFn: expect.any(Function),
    });
  });

  describe('addTransactionBatchFn wrapper', () => {
    function setupWithKeyring(keyringType: string, accounts: string[]) {
      const requestMock = getInitRequestMock();
      const mockAddTransactionBatch = jest.fn().mockResolvedValue({
        batchId: '0x1',
      });
      requestMock.getController.mockReturnValue({
        addTransaction: jest.fn(),
        addTransactionBatch: mockAddTransactionBatch,
        estimateGasFee: jest.fn(),
        updateTransaction: jest.fn(),
      } as unknown as TransactionController);
      requestMock.getFlatState.mockReturnValue({
        keyrings: [
          {
            type: keyringType,
            accounts,
            metadata: {
              id: '',
              name: '',
            },
          },
        ],
        pinnedAccountList: [],
        hiddenAccountList: [],
        internalAccounts: {
          accounts: undefined,
          selectedAccount: ''
        },
        accountIdByAddress: undefined,
        alertEnabledness: undefined,
        unconnectedAccountAlertShownOrigins: undefined,
        accountTree: {
          wallets: {},
          selectedAccountGroup: ''
        },
        isAccountTreeSyncingInProgress: false,
        hasAccountTreeSyncingSyncedAtLeastOnce: false,
        accountGroupsMetadata: undefined,
        accountWalletsMetadata: undefined,
        addressBook: {},
        announcements: {},
        currentAppVersion: '',
        previousAppVersion: '',
        previousMigrationVersion: 0,
        currentMigrationVersion: 0,
        pendingApprovals: undefined,
        pendingApprovalCount: 0,
        approvalFlows: [],
        activeQrCodeScanRequest: null,
        addressSecurityAlertResponses: undefined,
        browserEnvironment: undefined,
        connectedStatusPopoverHasBeenShown: false,
        currentExtensionPopupId: 0,
        defaultHomeActiveTabName: null,
        fullScreenGasPollTokens: [],
        hadAdvancedGasFeesSetPriorToMigration92_3: false,
        canTrackWalletFundsObtained: false,
        isRampCardClosed: false,
        pendingExtensionVersion: null,
        lastUpdatedAt: null,
        lastUpdatedFromVersion: null,
        lastViewedUserSurvey: null,
        networkConnectionBanner: {
          status: 'available'
        },
        newPrivacyPolicyToastClickedOrClosed: null,
        newPrivacyPolicyToastShownDate: null,
        pna25Acknowledged: false,
        nftsDetectionNoticeDismissed: false,
        nftsDropdownState: null,
        notificationGasPollTokens: [],
        onboardingDate: null,
        outdatedBrowserWarningLastShown: null,
        popupGasPollTokens: [],
        sidePanelGasPollTokens: [],
        recoveryPhraseReminderHasBeenShown: false,
        recoveryPhraseReminderLastShown: 0,
        showAccountBanner: false,
        showBetaHeader: false,
        showDownloadMobileAppSlide: false,
        showNetworkBanner: false,
        showPermissionsTour: false,
        showTestnetMessageInDropdown: false,
        signatureSecurityAlertResponses: undefined,
        slides: [],
        surveyLinkLastClickedOrClosed: null,
        shieldSubscriptionError: null,
        shieldEndingToastLastClickedOrClosed: null,
        shieldPausedToastLastClickedOrClosed: null,
        throttledOrigins: {},
        timeoutMinutes: 0,
        trezorModel: null,
        updateModalLastDismissedAt: null,
        hasShownMultichainAccountsIntroModal: false,
        musdConversionEducationSeen: false,
        musdConversionDismissedCtaKeys: [],
        showShieldEntryModalOnce: null,
        pendingRedirectRoute: null,
        pendingShieldCohort: null,
        pendingShieldCohortTxType: null,
        isWalletResetInProgress: false,
        storageWriteErrorType: null,
        assetsInfo: {},
        assetsBalance: {},
        assetsPrice: {},
        customAssets: {},
        assetPreferences: {},
        selectedCurrency: 'link',
        isSignedIn: false,
        quoteRequest: undefined,
        quotes: [],
        quotesInitialLoadTime: null,
        quotesLastFetched: null,
        quotesLoadingStatus: null,
        quoteFetchError: null,
        quotesRefreshCount: 0,
        assetExchangeRates: undefined,
        minimumBalanceForRentExemptionInLamports: null,
        txHistory: undefined,
        claims: [],
        claimsConfigurations: {
          validSubmissionWindowDays: 0,
          supportedNetworks: []
        },
        drafts: [],
        isUiOpen: false,
        events: undefined,
        currentCurrency: '',
        currencyRates: undefined,
        allDeFiPositions: {},
        allDeFiPositionsCount: {},
        delegations: {},
        ensEntries: {},
        ensResolutionsByAddress: {},
        gasFeeEstimates: {
          gasPrice: ''
        },
        estimatedGasFeeTimeBounds: undefined,
        gasEstimateType: 'eth_gasPrice',
        grantedPermissions: [],
        isFetchingGatorPermissions: false,
        pendingRevocations: [],
        lastSyncedTimestamp: 0,
        database: null,
        signature: null,
        lastUpdated: null,
        databaseUnavailable: false,
        isUnlocked: false,
        logs: {},
        metaMetricsId: null,
        participateInMetaMetrics: null,
        latestNonAnonymousEventTimestamp: 0,
        fragments: undefined,
        eventsBeforeMetricsOptIn: [],
        tracesBeforeMetricsOptIn: [],
        traits: {
          address_book_entries: undefined,
          ledger_connection_type: undefined,
          networks_added: undefined,
          networks_without_ticker: undefined,
          nft_autodetection_enabled: undefined,
          number_of_accounts: undefined,
          number_of_nft_collections: undefined,
          number_of_nfts: undefined,
          number_of_tokens: undefined,
          number_of_hd_entropies: undefined,
          opensea_api_enabled: undefined,
          three_box_enabled: undefined,
          theme: undefined,
          token_detection_enabled: undefined,
          current_currency: undefined,
          show_native_token_as_main_balance: undefined,
          use_native_as_primary_currency: undefined,
          is_metrics_opted_in: undefined,
          has_marketing_consent: undefined,
          install_date_ext: undefined,
          storage_kind: undefined,
          security_providers: undefined,
          token_sort_preference: undefined,
          petname_addresses_count: undefined,
          profile_id: undefined,
          has_rewards_opted_in: undefined,
          rewards_referred: undefined,
          rewards_referral_code_used: undefined,
          platform: undefined,
          install_type: undefined,
          device_type: undefined,
          os: undefined
        },
        dataCollectionForMarketing: null,
        marketingCampaignCookieId: null,
        segmentApiCalls: undefined,
        metaMetricsDataDeletionId: null,
        metaMetricsDataDeletionTimestamp: 0,
        assetsMetadata: {},
        accountsAssets: {},
        allIgnoredAssets: {},
        conversionRates: undefined,
        historicalPrices: undefined,
        balances: {},
        nonEvmTransactions: {},
        multichainNetworkConfigurationsByChainId: undefined,
        selectedMultichainNetworkChainId: BtcScope.Mainnet,
        isEvmSelected: false,
        networksWithTransactionActivity: undefined,
        names: undefined,
        nameSources: undefined,
        selectedNetworkClientId: '',
        networkConfigurationsByChainId: undefined,
        networksMetadata: undefined,
        orderedNetworkList: [],
        seedPhraseBackedUp: null,
        firstTimeFlowType: null,
        completedOnboarding: false,
        subjects: undefined,
        permissionHistory: undefined,
        permissionActivityLog: [],
        phishingLists: [],
        whitelist: [],
        whitelistPaths: undefined,
        hotlistLastFetched: 0,
        stalelistLastFetched: 0,
        c2DomainBlocklistLastFetched: 0,
        urlScanCache: undefined,
        tokenScanCache: undefined,
        addressScanCache: undefined,
        versionInfo: [],
        storageMetadata: [],
        featureFlags: {},
        ipfsGateway: '',
        isIpfsGatewayEnabled: false,
        isMultiAccountBalancesEnabled: false,
        securityAlertsEnabled: false,
        useNftDetection: false,
        useTokenDetection: false,
        useTransactionSimulations: false,
        useSafeChainsListValidation: false,
        advancedGasFee: undefined,
        currentLocale: '',
        dismissSeedBackUpReminder: false,
        enableMV3TimestampSave: false,
        forgottenPassword: false,
        knownMethodData: undefined,
        ledgerTransportType: LedgerTransportTypes.webhid,
        manageInstitutionalWallets: false,
        openSeaEnabled: false,
        overrideContentSecurityPolicyHeader: false,
        preferences: {
          autoLockTimeLimit: undefined,
          avatarType: undefined,
          defaultAddressScope: 'eip155',
          dismissSmartAccountSuggestionEnabled: false,
          featureNotificationsEnabled: false,
          hideZeroBalanceTokens: false,
          petnamesEnabled: false,
          privacyMode: false,
          showConfirmationAdvancedDetails: false,
          showDefaultAddress: false,
          showExtensionInFullSizeView: false,
          showFiatInTestnets: false,
          showMultiRpcModal: false,
          showNativeTokenAsMainBalance: false,
          showTestNetworks: false,
          skipDeepLinkInterstitial: false,
          smartTransactionsOptInStatus: false,
          smartTransactionsMigrationApplied: false,
          tokenNetworkFilter: undefined,
          tokenSortConfig: {
            key: '',
            order: '',
            sortCallback: ''
          },
          useNativeCurrencyAsPrimaryCurrency: false,
          useSidePanelAsDefault: undefined
        },
        snapRegistryList: undefined,
        theme: ThemeType.light,
        use4ByteResolution: false,
        useAddressBarEnsResolution: false,
        useBlockie: false,
        useCurrencyRateCheck: false,
        useExternalNameSources: false,
        useExternalServices: false,
        useMultiAccountBalanceChecker: false,
        usePhishDetect: false,
        referrals: undefined,
        watchEthereumAccountEnabled: false,
        fiatCurrency: '',
        rates: undefined,
        cryptocurrencies: [],
        remoteFeatureFlags: {},
        cacheTimestamp: 0,
        rewardsActiveAccount: null,
        rewardsAccounts: {},
        rewardsSubscriptions: {},
        rewardsSeasons: {},
        rewardsSeasonStatuses: {},
        rewardsSubscriptionTokens: {},
        rewardsPointsEstimateHistory: [],
        socialBackupsMetadata: [],
        isSeedlessOnboardingUserAuthenticated: false,
        domains: undefined,
        coverageResults: undefined,
        orderedTransactionHistory: [],
        signatureRequests: undefined,
        unapprovedPersonalMsgs: undefined,
        unapprovedTypedMessages: undefined,
        unapprovedPersonalMsgCount: 0,
        unapprovedTypedMessagesCount: 0,
        smartTransactionsState: {
          smartTransactions: undefined,
          userOptIn: null,
          userOptInV2: null,
          liveness: null,
          fees: {
            approvalTxFees: null,
            tradeTxFees: null
          },
          feesByChainId: undefined,
          livenessByChainId: undefined
        },
        snaps: undefined,
        snapStates: undefined,
        unencryptedSnapStates: undefined,
        isReady: false,
        insights: undefined,
        interfaces: undefined,
        trialedProducts: [],
        subscriptions: [],
        tokenBalances: undefined,
        tokensChainsCache: {},
        allTokens: {},
        allIgnoredTokens: {},
        allDetectedTokens: {},
        transactions: [],
        transactionBatches: [],
        methodData: undefined,
        lastFetchedBlockNumbers: {},
        submitHistory: [],
        transactionData: undefined,
        userOperations: undefined,
        isBackupAndSyncEnabled: false,
        isBackupAndSyncUpdateLoading: false,
        isAccountSyncingEnabled: false,
        isContactSyncingEnabled: false,
        isContactSyncingInProgress: false,
        marketData: undefined,
        allNftContracts: {},
        allNfts: {},
        ignoredNfts: [],
        enabledNetworkMap: undefined,
        nativeAssetIdentifiers: undefined,
        accountsByChainId: undefined,
        initialEnqueueCompleted: false,
        syncQueue: undefined
      });

      BridgeStatusControllerInit(requestMock);

      const controllerMock = jest.mocked(BridgeStatusController);
      const { addTransactionBatchFn } =
        controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];

      return { addTransactionBatchFn, mockAddTransactionBatch };
    }

    it('clears gas sponsorship flags for hardware wallet accounts', () => {
      const { addTransactionBatchFn, mockAddTransactionBatch } =
        setupWithKeyring('Ledger Hardware', ['0xhardwareaccount']);

      addTransactionBatchFn({
        from: '0xHardwareAccount',
        isGasFeeSponsored: true,
        isGasFeeIncluded: true,
        disable7702: false,
        networkClientId: 'test',
        transactions: [],
      });

      expect(mockAddTransactionBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          isGasFeeSponsored: false,
          isGasFeeIncluded: false,
          disable7702: true,
        }),
      );
    });

    it('preserves gas sponsorship flags for HD wallet accounts', () => {
      const { addTransactionBatchFn, mockAddTransactionBatch } =
        setupWithKeyring('HD Key Tree', ['0xhdaccount']);

      addTransactionBatchFn({
        from: '0xHDAccount',
        isGasFeeSponsored: true,
        isGasFeeIncluded: true,
        disable7702: false,
        networkClientId: 'test',
        transactions: [],
      });

      expect(mockAddTransactionBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          isGasFeeSponsored: true,
          isGasFeeIncluded: true,
          disable7702: false,
        }),
      );
    });
  });
});
