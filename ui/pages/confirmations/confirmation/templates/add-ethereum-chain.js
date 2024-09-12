import { ethErrors } from 'eth-rpc-errors';
import React from 'react';

import {
  infuraProjectId,
  DEPRECATED_NETWORKS,
} from '../../../../../shared/constants/network';
import {
  Severity,
  TypographyVariant,
  TextAlign,
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import { BannerAlertSeverity } from '../../../../components/component-library';
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

const multichainFlag = process.env.CHAIN_PERMISSIONS;

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
      pendingApproval.requestData.chainName.toLowerCase()
    ) {
      alerts.push(MISMATCHED_NETWORK_NAME);
    }
    if (
      data.matchedChain.nativeCurrency?.symbol?.toLowerCase() !==
      pendingApproval.requestData.ticker?.toLowerCase()
    ) {
      alerts.push(MISMATCHED_NETWORK_SYMBOL);
    }

    const { origin } = new URL(pendingApproval.requestData.rpcUrl);
    if (
      !data.matchedChain.rpc?.map((rpc) => new URL(rpc).origin).includes(origin)
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
  const childrenTitleText = process.env.CHAIN_PERMISSIONS
    ? t('addNetworkConfirmationTitle', [pendingApproval.requestData.chainName])
    : t('addEthereumChainConfirmationTitle');
  return {
    content: [
      {
        hide: !originIsMetaMask,
        element: 'Box',
        key: 'network-box',
        props: {
          textAlign: TextAlign.Center,
          display: Display.Flex,
          justifyContent: JustifyContent.center,
          marginTop: 4,
          marginBottom: 2,
        },
        children: [
          {
            element: 'Chip',
            key: 'network-chip',
            props: {
              label: pendingApproval.requestData.chainName,
              backgroundColor: BackgroundColor.backgroundAlternative,
              leftIconUrl: pendingApproval.requestData.imageUrl,
            },
          },
        ],
      },
      multichainFlag && {
        element: 'BannerAlert',
        key: 'only-add-networks-you-trust',
        children: [
          {
            element: 'Typography',
            key: 'description',
            props: {
              style: { display: originIsMetaMask && '-webkit-box' },
            },
            children: [
              `${t('unknownChainWarning')} `,
              {
                hide: !originIsMetaMask,
                element: 'Tooltip',
                key: 'tooltip-info',
                props: {
                  position: 'bottom',
                  interactive: true,
                  trigger: 'mouseenter',
                  html: (
                    <div
                      style={{
                        width: '180px',
                        margin: '16px',
                        textAlign: 'left',
                      }}
                    >
                      <a
                        key="zendesk_page_link"
                        href={ZENDESK_URLS.UNKNOWN_NETWORK}
                        rel="noreferrer"
                        target="_blank"
                        style={{ color: 'var(--color-primary-default)' }}
                      >
                        {t('learnMoreUpperCase')}
                      </a>
                    </div>
                  ),
                },
                children: [
                  {
                    element: 'i',
                    key: 'info-circle',
                    props: {
                      className: 'fas fa-info-circle',
                      style: {
                        marginLeft: '4px',
                        color: 'var(--color-icon-default)',
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            element: 'a',
            children: t('learnMoreUpperCase'),
            key: 'learnMoreUpperCase',
            props: {
              href: ZENDESK_URLS.USER_GUIDE_CUSTOM_NETWORKS,
              target: '__blank',
            },
          },
        ],
        props: {
          severity: BannerAlertSeverity.Warning,
          boxProps: {
            margin: [0, 4],
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
          },
        },
      },

      {
        element: 'Typography',
        key: 'title',
        children: originIsMetaMask
          ? t('wantToAddThisNetwork')
          : childrenTitleText,
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
        children: process.env.CHAIN_PERMISSIONS
          ? t('multichainAddEthereumChainConfirmationDescription')
          : t('addEthereumChainConfirmationDescription'),
        props: {
          variant: TypographyVariant.H7,
          align: 'center',
          boxProps: {
            margin: originIsMetaMask ? [0, 8, 4] : [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'only-add-networks-you-trust',
        children: process.env.CHAIN_PERMISSIONS
          ? []
          : [
              {
                element: 'b',
                key: 'bolded-text',
                props: {
                  style: { display: originIsMetaMask && '-webkit-box' },
                },
                children: [
                  `${t('addEthereumChainConfirmationRisks')} `,
                  {
                    hide: !originIsMetaMask,
                    element: 'Tooltip',
                    key: 'tooltip-info',
                    props: {
                      position: 'bottom',
                      interactive: true,
                      trigger: 'mouseenter',
                      html: (
                        <div
                          style={{
                            width: '180px',
                            margin: '16px',
                            textAlign: 'left',
                          }}
                        >
                          {t('someNetworksMayPoseSecurity')}{' '}
                          <a
                            key="zendesk_page_link"
                            href={ZENDESK_URLS.UNKNOWN_NETWORK}
                            rel="noreferrer"
                            target="_blank"
                            style={{ color: 'var(--color-primary-default)' }}
                          >
                            {t('learnMoreUpperCase')}
                          </a>
                        </div>
                      ),
                    },
                    children: [
                      {
                        element: 'i',
                        key: 'info-circle',
                        props: {
                          className: 'fas fa-info-circle',
                          style: {
                            marginLeft: '4px',
                            color: 'var(--color-icon-default)',
                          },
                        },
                      },
                    ],
                  },
                ],
              },
              {
                element: 'MetaMaskTranslation',
                key: 'learn-about-risks',
                props: {
                  translationKey: 'addEthereumChainConfirmationRisksLearnMore',
                  variables: [
                    {
                      element: 'a',
                      children: t(
                        'addEthereumChainConfirmationRisksLearnMoreLink',
                      ),
                      key: 'addEthereumChainConfirmationRisksLearnMoreLink',
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
          variant: TypographyVariant.H7,
          boxProps: {
            margin: originIsMetaMask ? [0, 8] : 0,
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
          },
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
            [t('networkURL')]: isValidASCIIURL(customRpcUrl)
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
          prefaceKeys: process.env.CHAIN_PERMISSIONS
            ? [t('currencySymbol'), t('networkURL')]
            : [
                t('networkName'),
                t('networkURL'),
                t('chainId'),
                t('currencySymbol'),
              ],
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
        const networkConfigurationId = await actions.upsertNetworkConfiguration(
          {
            ...pendingApproval.requestData,
            nickname: pendingApproval.requestData.chainName,
          },
          {
            setActive: false,
            source: pendingApproval.requestData.source,
          },
        );
        await actions.setNewNetworkAdded({
          networkConfigurationId,
          nickname: pendingApproval.requestData.chainName,
        });

        history.push(DEFAULT_ROUTE);
      }
      return [];
    },
    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        ethErrors.provider.userRejectedRequest().serialize(),
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
