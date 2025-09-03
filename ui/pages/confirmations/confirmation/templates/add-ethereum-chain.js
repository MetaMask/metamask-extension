import { providerErrors } from '@metamask/rpc-errors';
import { RpcEndpointType } from '@metamask/network-controller';
import {
  infuraProjectId,
  DEPRECATED_NETWORKS,
  WHITELIST_NETWORK_NAME,
  WHITELIST_SYMBOL,
  WHITELIST_NETWORK_RPC_URL,
} from '../../../../../shared/constants/network';
import {
  AlignItems,
  Display,
  FlexDirection,
  Severity,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import { isValidASCIIURL, toPunycodeURL } from '../../utils/confirm';

const UNRECOGNIZED_CHAIN = {
  id: 'UNRECOGNIZED_CHAIN',
  severity: Severity.Warning,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'unrecognizedChain',
      },
    },
  },
};

const SAFE_CHAIN_LIST_PROVIDER_ERROR = {
  id: 'SAFE_CHAIN_LIST_PROVIDER_ERROR',
  severity: Severity.Warning,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'errorGettingSafeChainList',
      },
    },
  },
};

const MISMATCHED_CHAIN_RECOMMENDATION = {
  id: 'MISMATCHED_CHAIN_RECOMMENDATION',
  severity: Severity.Warning,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedChainRecommendation',
        variables: [
          {
            element: 'a',
            key: 'mismatchedChainLink',
            props: {
              href: ZENDESK_URLS.VERIFY_CUSTOM_NETWORK,
              target: '__blank',
              tabIndex: 0,
            },
            children: {
              element: 'MetaMaskTranslation',
              props: {
                translationKey: 'mismatchedChainLinkText',
              },
            },
          },
        ],
      },
    },
  },
};

const DEPRECATED_CHAIN_ALERT = {
  id: 'DEPRECATED_CHAIN_ALERT',
  severity: Severity.Warning,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'deprecatedNetwork',
      },
    },
  },
};

const MISMATCHED_NETWORK_NAME = {
  id: 'MISMATCHED_NETWORK_NAME',
  severity: Severity.Warning,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedNetworkName',
      },
    },
  },
};

const MISMATCHED_NETWORK_SYMBOL = {
  id: 'MISMATCHED_NETWORK_SYMBOL',
  severity: Severity.Danger,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedNetworkSymbol',
      },
    },
  },
};

const MISMATCHED_NETWORK_RPC = {
  id: 'MISMATCHED_NETWORK_RPC',
  severity: Severity.Danger,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedRpcUrl',
      },
    },
  },
};

const MISMATCHED_NETWORK_RPC_CHAIN_ID = {
  id: 'MISMATCHED_NETWORK_RPC_CHAIN_ID',
  severity: Severity.Danger,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'mismatchedRpcChainId',
      },
    },
  },
};

const ERROR_CONNECTING_TO_RPC = {
  id: 'ERROR_CONNECTING_TO_RPC',
  severity: Severity.Danger,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'errorWhileConnectingToRPC',
      },
    },
  },
};

async function getAlerts(pendingApproval, data) {
  const alerts = [];

  const originIsMetaMask = pendingApproval.origin === 'metamask';
  if (originIsMetaMask && Boolean(data.matchedChain)) {
    return [];
  }

  if (data.matchedChain) {
    if (
      data.matchedChain.name?.toLowerCase() !==
        pendingApproval.requestData.chainName.toLowerCase() &&
      WHITELIST_NETWORK_NAME[
        pendingApproval.requestData.chainId
      ]?.toLowerCase() !== pendingApproval.requestData.chainName.toLowerCase()
    ) {
      alerts.push(MISMATCHED_NETWORK_NAME);
    }
    if (
      data.matchedChain.nativeCurrency?.symbol?.toLowerCase() !==
        pendingApproval.requestData.ticker?.toLowerCase() &&
      WHITELIST_SYMBOL[pendingApproval.requestData.chainId]?.toLowerCase() !==
        pendingApproval.requestData.ticker?.toLowerCase()
    ) {
      alerts.push(MISMATCHED_NETWORK_SYMBOL);
    }

    const { origin } = new URL(pendingApproval.requestData.rpcUrl);
    if (
      !data.matchedChain.rpc
        ?.map((rpc) => new URL(rpc).origin)
        .includes(origin) &&
      WHITELIST_NETWORK_RPC_URL[pendingApproval.requestData.chainId] !== origin
    ) {
      alerts.push(MISMATCHED_NETWORK_RPC);
    }
    if (DEPRECATED_NETWORKS.includes(pendingApproval.requestData.chainId)) {
      alerts.push(DEPRECATED_CHAIN_ALERT);
    }
  }

  if (!data.matchedChain && data.useSafeChainsListValidation) {
    if (data.providerError) {
      alerts.push(SAFE_CHAIN_LIST_PROVIDER_ERROR);
    } else {
      alerts.push(UNRECOGNIZED_CHAIN);
    }
  }

  if (alerts.length) {
    alerts.push(MISMATCHED_CHAIN_RECOMMENDATION);
  }

  return alerts;
}

function getState(pendingApproval) {
  if (parseInt(pendingApproval.requestData.chainId, 16) === 1) {
    return { useWarningModal: true };
  }
  return {};
}

function getValues(pendingApproval, t, actions, history, data) {
  const originIsMetaMask = pendingApproval.origin === 'metamask';
  const customRpcUrl = pendingApproval.requestData.rpcUrl;

  let title;
  if (originIsMetaMask) {
    title = t('wantToAddThisNetwork');
  } else if (data.existingNetworkConfiguration) {
    title = t('updateNetworkConfirmationTitle', [
      data.existingNetworkConfiguration.name,
    ]);
  } else {
    title = t('addNetworkConfirmationTitle', [
      pendingApproval.requestData.chainName,
    ]);
  }

  let subtitle;
  if (data.existingNetworkConfiguration) {
    subtitle = t('updateEthereumChainConfirmationDescription');
  } else {
    subtitle = t('multichainAddEthereumChainConfirmationDescription');
  }

  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: title,
        props: {
          variant: TypographyVariant.H3,
          align: 'center',
          fontWeight: 'bold',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: subtitle,
        props: {
          variant: TypographyVariant.H6,
          align: 'center',
          boxProps: {
            margin: originIsMetaMask ? [0, 8, 4] : [0, 0, 4],
          },
        },
      },
      {
        element: 'OriginPill',
        key: 'origin-pill',
        props: {
          origin: pendingApproval.origin,
          dataTestId: 'signature-origin-pill',
        },
      },
      {
        element: 'TruncatedDefinitionList',
        key: 'network-details',
        props: {
          title: t('networkDetails'),
          tooltips: {
            [t('currencySymbol')]: t('currencySymbolDefinition'),
            [t('networkURL')]: t('networkURLDefinition'),
            [t('chainId')]: t('chainIdDefinition'),
            [t('networkName')]: t('networkNameDefinition'),
            [t('blockExplorerUrl')]: t('blockExplorerUrlDefinition'),
          },
          warnings: {
            [t('networkURL')]:
              !customRpcUrl || isValidASCIIURL(customRpcUrl)
                ? undefined
                : t('networkUrlErrorWarning', [toPunycodeURL(customRpcUrl)]),
            [t('currencySymbol')]: data.currencySymbolWarning,
          },
          dictionary: {
            [t('currencySymbol')]: pendingApproval.requestData.ticker,
            [t('networkURL')]: customRpcUrl
              .toLowerCase()
              ?.includes(`/v3/${infuraProjectId}`)
              ? customRpcUrl.replace(`/v3/${infuraProjectId}`, '').toLowerCase()
              : customRpcUrl.toLowerCase(),
            [t('chainId')]: parseInt(pendingApproval.requestData.chainId, 16),
            [t('networkName')]: pendingApproval.requestData.chainName,
            [t('blockExplorerUrl')]:
              pendingApproval.requestData.rpcPrefs.blockExplorerUrl,
          },
          prefaceKeys: [t('currencySymbol'), t('networkURL')],
        },
      },
      {
        element: 'Typography',
        key: 'only-add-networks-you-trust',
        children: [
          {
            element: 'MetaMaskTranslation',
            key: 'learn-about-risks',
            props: {
              translationKey: 'watchOutMessage',
              variables: [
                {
                  element: 'a',
                  children: t('securityMessageLinkForNetworks'),
                  key: 'securityMessageLinkForNetworks',
                  props: {
                    href: ZENDESK_URLS.USER_GUIDE_CUSTOM_NETWORKS,
                    target: '__blank',
                  },
                },
              ],
            },
          },
        ],
        props: {
          variant: TypographyVariant.H6,
          boxProps: {
            margin: originIsMetaMask ? [0, 8] : 0,
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
          },
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('approveButtonText'),
    loadingText: t('addingCustomNetwork'),
    onSubmit: async () => {
      let endpointChainId;
      try {
        endpointChainId = await jsonRpcRequest(customRpcUrl, 'eth_chainId');
      } catch (err) {
        console.error(
          `Request for method 'eth_chainId on ${customRpcUrl} failed`,
        );
        return [ERROR_CONNECTING_TO_RPC];
      }

      if (pendingApproval.requestData.chainId !== endpointChainId) {
        console.error(
          `Chain ID returned by RPC URL ${customRpcUrl} does not match ${endpointChainId}`,
        );
        return [MISMATCHED_NETWORK_RPC_CHAIN_ID];
      }

      await actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData,
      );
      if (originIsMetaMask) {
        const blockExplorer =
          pendingApproval.requestData.rpcPrefs.blockExplorerUrl;

        const addedNetwork = await actions.addNetwork({
          chainId: pendingApproval.requestData.chainId,
          name: pendingApproval.requestData.chainName,
          nativeCurrency: pendingApproval.requestData.ticker,
          blockExplorerUrls: blockExplorer ? [blockExplorer] : [],
          defaultBlockExplorerUrlIndex: blockExplorer ? 0 : undefined,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: pendingApproval.requestData.rpcUrl,
              failoverUrls: pendingApproval.requestData.failoverRpcUrls,
              type: RpcEndpointType.Custom,
            },
          ],
        });

        await actions.setNewNetworkAdded({
          networkConfigurationId: addedNetwork.rpcEndpoints[0].networkClientId,
          nickname: pendingApproval.requestData.chainName,
        });

        const locationPath = document.location.hash.replace('#', '/');
        const isOnboardingRoute =
          locationPath === ONBOARDING_PRIVACY_SETTINGS_ROUTE;

        if (!isOnboardingRoute) {
          history.push(DEFAULT_ROUTE);
        }
      }
      return [];
    },
    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        providerErrors.userRejectedRequest().serialize(),
      ),
    networkDisplay: !originIsMetaMask,
  };
}

const addEthereumChain = {
  getAlerts,
  getValues,
  getState,
};

export default addEthereumChain;
