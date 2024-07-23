import log from 'loglevel';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { isStrictHexString } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  CHAIN_IDS,
  infuraProjectId,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import {
  decimalToHex,
  hexToDecimal,
} from '../../../../../shared/modules/conversion.utils';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../selectors';
import {
  addNetwork,
  setEditedNetwork,
  showDeprecatedNetworkModal,
  toggleNetworkMenu,
  updateNetwork,
} from '../../../../store/actions';
import {
  Box,
  ButtonLink,
  ButtonPrimary,
  ButtonPrimarySize,
  HelpText,
  HelpTextSeverity,
  Text,
} from '../../../../components/component-library';
import { FormTextField } from '../../../../components/component-library/form-text-field/deprecated';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import DropdownEditor from './dropdown-editor';
import { useSafeChains } from './use-safe-chains';
import { useNetworkFormState } from './networks-form-state';

const NetworksForm = ({
  networkFormState,
  existingNetwork,
  onRpcAdd,
  onBlockExplorerAdd,
  isOnBoarding = false,
  onSave = () => null,
}: {
  networkFormState: ReturnType<typeof useNetworkFormState>;
  existingNetwork?: NetworkConfiguration;
  onRpcAdd: () => void;
  onBlockExplorerAdd: () => void;
  isOnBoarding?: boolean;
  onSave?: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const currentChainId = useSelector(getCurrentChainId);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const {
    name,
    setName,
    chainId,
    setChainId,
    ticker,
    setTicker,
    rpcUrls,
    setRpcUrls,
    blockExplorers,
    setBlockExplorers,
  } = networkFormState;

  const { safeChains } = useSafeChains();

  const [errors, setErrors] = useState<
    Record<string, { key: string; msg: string } | undefined>
  >({});

  const [warnings, setWarnings] = useState<
    Record<string, { key: string; msg: string } | undefined>
  >({});

  const [suggestedName, setSuggestedName] = useState<string>();
  const [suggestedTicker, setSuggestedTicker] = useState<string>();
  const [fetchedChainId, setFetchedChainId] = useState<string>();

  const templateInfuraRpc = (endpoint: string) =>
    endpoint.endsWith('{infuraProjectId}')
      ? endpoint.replace('{infuraProjectId}', infuraProjectId ?? '')
      : endpoint;

  // Validate the network name when it changes
  useEffect(() => {
    const chainIdHex = toHex(chainId);
    const expectedName = !chainIdHex
      ? undefined
      : NETWORK_TO_NAME_MAP[chainIdHex] ??
        safeChains?.find(({ chainId }) => toHex(chainId) === chainIdHex)?.name;

    const mismatch = expectedName && expectedName !== name;
    setSuggestedName(mismatch ? expectedName : undefined);
    setWarnings((state) => ({
      ...state,
      name: mismatch
        ? {
            key: 'wrongNetworkName',
            msg: t('wrongNetworkName'),
          }
        : undefined,
    }));
  }, [chainId, name, safeChains]);

  // Validate the ticker when it changes
  useEffect(() => {
    const chainIdHex = toHex(chainId);
    const expectedSymbol = !chainIdHex
      ? undefined
      : safeChains?.find(({ chainId }) => toHex(chainId) === chainIdHex)
          ?.nativeCurrency?.symbol;

    const mismatch = expectedSymbol && expectedSymbol !== ticker;
    setSuggestedTicker(mismatch ? expectedSymbol : undefined);
    setWarnings((state) => ({
      ...state,
      ticker: mismatch
        ? {
            key: 'chainListReturnedDifferentTickerSymbol',
            msg: t('chainListReturnedDifferentTickerSymbol'),
          }
        : undefined,
    }));
  }, [chainId, ticker, safeChains]);

  // Validate the chain ID when it changes
  useEffect(() => {
    let error;

    if (chainId === undefined || chainId === '') {
      error = undefined;
    } else if (chainId.startsWith('0x')) {
      if (!/^0x[0-9a-f]+$/iu.test(chainId)) {
        error = ['invalidHexNumber', t('invalidHexNumber')];
      } else if (!isPrefixedFormattedHexString(chainId)) {
        error = ['invalidHexNumber', t('invalidHexNumberLeadingZeros')];
      }
    } else if (!/^[0-9]+$/u.test(chainId)) {
      error = ['invalidNumber', t('invalidNumber')];
    } else if (chainId.startsWith('0')) {
      error = ['invalidNumberLeadingZeros', t('invalidNumberLeadingZeros')];
    }

    if (
      chainId &&
      !error &&
      !isSafeChainId(parseInt(chainId, chainId.startsWith('0x') ? 16 : 10))
    ) {
      error = ['invalidChainIdTooBig', t('invalidChainIdTooBig')];
    }

    if (!error && !existingNetwork) {
      const matchingNetwork = networkConfigurations[toHex(chainId)];
      if (matchingNetwork) {
        error = [
          'existingChainId',
          t('chainIdExistsErrorMsg', [matchingNetwork.name]),
        ];
      }
    }

    let rpcError;
    if (fetchedChainId && fetchedChainId !== toHex(chainId)) {
      rpcError = [
        'endpointReturnedDifferentChainId',
        t('endpointReturnedDifferentChainId', [hexToDecimal(fetchedChainId)]),
      ];
    }

    setErrors((state) => ({
      ...state,
      chainId: error ? { key: error[0], msg: error[1] } : undefined,
      rpcUrl: rpcError ? { key: rpcError[0], msg: rpcError[1] } : undefined,
    }));
  }, [chainId, fetchedChainId, existingNetwork?.chainId]);

  // Fetch the chain ID from the RPC endpoint when it changes
  useEffect(() => {
    const rpcUrl =
      rpcUrls?.rpcEndpoints?.[rpcUrls?.defaultRpcEndpointIndex]?.url;

    if (rpcUrl) {
      jsonRpcRequest(templateInfuraRpc(rpcUrl), 'eth_chainId')
        .then((response) => {
          if (chainId === undefined || chainId == '') {
            setChainId(hexToDecimal(response));
          }
          setFetchedChainId(response);
        })
        .catch((err) => {
          setFetchedChainId(undefined);
          log.warn('Failed to fetch the chainId from the endpoint.', err);
          setErrors((state) => ({
            ...state,
            rpcUrl: {
              key: 'failedToFetchChainId',
              msg: t('failedToFetchChainId'),
            },
          }));
        });
    }
  }, [chainId, rpcUrls]);

  const onSubmit = async () => {
    try {
      const chainIdHex = toHex(chainId);
      if (chainIdHex === CHAIN_IDS.GOERLI) {
        dispatch(showDeprecatedNetworkModal());
      } else {
        const networkPayload = {
          chainId: chainIdHex,
          name,
          nativeCurrency: ticker,
          rpcEndpoints: rpcUrls?.rpcEndpoints,
          defaultRpcEndpointIndex: rpcUrls?.defaultRpcEndpointIndex,
          blockExplorerUrls: blockExplorers?.blockExplorerUrls,
          defaultBlockExplorerUrlIndex:
            blockExplorers?.defaultBlockExplorerUrlIndex,
        };

        if (!existingNetwork) {
          await dispatch(addNetwork(networkPayload));
        } else {
          const options = {
            replacementSelectedRpcEndpointIndex:
              chainIdHex === currentChainId
                ? rpcUrls?.defaultRpcEndpointIndex
                : undefined,
          };
          await dispatch(updateNetwork(networkPayload, options));
        }

        trackEvent({
          event: MetaMetricsEventName.CustomNetworkAdded,
          category: MetaMetricsEventCategory.Network,
          properties: {
            block_explorer_url:
              blockExplorers?.blockExplorerUrls?.[
                blockExplorers?.defaultBlockExplorerUrlIndex
              ],
            chain_id: chainIdHex,
            network_name: name,
            source_connection_method:
              MetaMetricsNetworkEventSource.CustomNetworkForm,
            token_symbol: ticker,
          },
        });

        if (!isOnBoarding) {
          dispatch(
            setEditedNetwork({
              chainId: chainIdHex,
              nickname: name,
              editCompleted: true,
              newNetwork: !existingNetwork,
            }),
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (isOnBoarding) {
        onSave();
        return;
      }
      dispatch(toggleNetworkMenu());
    }
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      ref={scrollableRef}
      className="networks-tab__scrollable"
    >
      <Box
        width={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={12}
      >
        <FormTextField
          placeholder={t('enterNetworkName')}
          data-testid="network-form-name-input"
          helpText={
            <>
              {warnings?.name?.msg && (
                <HelpText severity={HelpTextSeverity.Warning}>
                  {warnings?.name?.msg}
                </HelpText>
              )}

              {suggestedName && (
                <Text
                  as="span"
                  variant={TextVariant.bodyXs}
                  color={TextColor.textDefault}
                  data-testid="network-form-name-suggestion"
                >
                  {t('suggestedTokenName')}
                  <ButtonLink
                    as="button"
                    variant={TextVariant.bodyXs}
                    color={TextColor.primaryDefault}
                    onClick={() => {
                      setName(suggestedName);
                    }}
                    paddingLeft={1}
                    paddingRight={1}
                    style={{ verticalAlign: 'baseline' }}
                  >
                    {suggestedName}
                  </ButtonLink>
                </Text>
              )}
            </>
          }
          onChange={(e: any) => {
            setName(e.target?.value);
          }}
          label={t('name')}
          labelProps={{
            variant: TextVariant.bodySm,
            fontWeight: FontWeight.Bold,
          }}
          inputProps={{
            variant: TextVariant.bodySm,
            'data-testid': 'network-form-network-name',
          }}
          value={name}
        />
        <DropdownEditor
          title={t('defaultRpcUrl')}
          items={rpcUrls.rpcEndpoints}
          selectedItemIndex={rpcUrls.defaultRpcEndpointIndex}
          itemKey={(endpoint) => endpoint.url}
          renderItem={(item) => {
            const displayEndpoint = (endpoint: string) => {
              endpoint = endpoint.endsWith('/v3/{infuraProjectId}')
                ? endpoint.replace('/v3/{infuraProjectId}', '')
                : endpoint.endsWith(`/v3/${infuraProjectId}`)
                ? endpoint.replace(`/v3/${infuraProjectId}`, '')
                : endpoint;

              const url = new URL(endpoint);
              return `${url.host}${url.pathname === '/' ? '' : url.pathname}`;
            };

            return (
              <Box display={Display.Flex} alignItems={AlignItems.center}>
                <Text
                  as="button"
                  padding={0}
                  color={TextColor.textDefault}
                  variant={TextVariant.bodySmMedium}
                  backgroundColor={BackgroundColor.transparent}
                >
                  {item.name ? item.name : displayEndpoint(item.url)}
                </Text>

                {item.name && (
                  <Text
                    color={TextColor.textAlternative}
                    variant={TextVariant.bodySmMedium}
                    ellipsis
                  >
                    &nbsp;{'•'}&nbsp;
                    {displayEndpoint(item.url)}
                  </Text>
                )}
              </Box>
            );
          }}
          addButtonText={t('addRpcUrl')}
          itemIsDeletable={(item, items) =>
            item.type !== RpcEndpointType.Infura && items.length > 1
          }
          onItemAdd={onRpcAdd}
          onItemSelected={(index) =>
            setRpcUrls((state) => ({
              ...state,
              defaultRpcEndpointIndex: index,
            }))
          }
          onItemDeleted={(deletedIndex, newSelectedIndex) => {
            setRpcUrls({
              rpcEndpoints: rpcUrls.rpcEndpoints
                ?.slice(0, deletedIndex)
                .concat(rpcUrls.rpcEndpoints.slice(deletedIndex + 1)),
              defaultRpcEndpointIndex: newSelectedIndex,
            });
          }}
        />

        {errors.rpcUrl?.msg && (
          <Box>
            <HelpText
              severity={HelpTextSeverity.Danger}
              data-testid="network-form-chain-id-error"
            >
              {errors.rpcUrl?.msg}
            </HelpText>
          </Box>
        )}
        <FormTextField
          placeholder={t('enterChainId')}
          paddingTop={4}
          data-testid="network-form-chain-id-input"
          onChange={(e) => {
            setChainId(e.target?.value.trim());
          }}
          error={errors?.chainId}
          label={t('chainId')}
          labelProps={{
            variant: TextVariant.bodySm,
            fontWeight: FontWeight.Bold,
          }}
          inputProps={{
            variant: TextVariant.bodySm,
            'data-testid': 'network-form-chain-id',
          }}
          value={chainId}
          disabled={Boolean(existingNetwork)}
        />

        {errors.chainId?.msg ? (
          <HelpText
            severity={HelpTextSeverity.Danger}
            data-testid="network-form-chain-id-error"
          >
            {errors.chainId.msg}
          </HelpText>
        ) : null}
        {errors.chainId?.key === 'existingChainId' ? (
          <Box>
            <HelpText
              severity={HelpTextSeverity.Danger}
              data-testid="network-form-chain-id-error"
            >
              {t('updateOrEditNetworkInformations')}{' '}
              <ButtonLink
                as="button"
                variant={TextVariant.bodyXs}
                color={TextColor.primaryDefault}
                onClick={() => {
                  dispatch(
                    setEditedNetwork({
                      chainId: toHex(chainId),
                    }),
                  );
                }}
              >
                {t('editNetworkLink')}
              </ButtonLink>
            </HelpText>
          </Box>
        ) : null}
        <FormTextField
          placeholder={t('enterSymbol')}
          paddingTop={4}
          data-testid="network-form-ticker"
          helpText={
            suggestedTicker ? (
              <Text
                as="span"
                variant={TextVariant.bodyXs}
                color={TextColor.textDefault}
                data-testid="network-form-ticker-suggestion"
              >
                {t('suggestedCurrencySymbol')}
                <ButtonLink
                  as="button"
                  variant={TextVariant.bodyXs}
                  color={TextColor.primaryDefault}
                  onClick={() => {
                    setTicker(suggestedTicker);
                  }}
                  paddingLeft={1}
                  paddingRight={1}
                  style={{ verticalAlign: 'baseline' }}
                >
                  {suggestedTicker}
                </ButtonLink>
              </Text>
            ) : null
          }
          onChange={(e: any) => {
            setTicker(e.target?.value);
          }}
          label={t('currencySymbol')}
          labelProps={{
            variant: TextVariant.bodySm,
            fontWeight: FontWeight.Bold,
          }}
          inputProps={{
            variant: TextVariant.bodySm,
            'data-testid': 'network-form-ticker-input',
          }}
          value={ticker}
        />
        {warnings.ticker?.msg ? (
          <HelpText
            severity={HelpTextSeverity.Warning}
            data-testid="network-form-ticker-warning"
          >
            {warnings.ticker.msg}
          </HelpText>
        ) : null}

        <DropdownEditor
          title={t('blockExplorerUrl')}
          items={blockExplorers.blockExplorerUrls}
          selectedItemIndex={blockExplorers.defaultBlockExplorerUrlIndex}
          addButtonText={t('addBlockExplorerUrl')}
          onItemAdd={onBlockExplorerAdd}
          onItemSelected={(index) =>
            setBlockExplorers((state) => ({
              ...state,
              defaultBlockExplorerUrlIndex: index,
            }))
          }
          onItemDeleted={(deletedIndex, newSelectedIndex) => {
            setBlockExplorers({
              blockExplorerUrls: blockExplorers.blockExplorerUrls
                ?.slice(0, deletedIndex)
                .concat(
                  blockExplorers.blockExplorerUrls.slice(deletedIndex + 1),
                ),
              defaultBlockExplorerUrlIndex: newSelectedIndex,
            });
          }}
          onDropdownOpened={() => {
            if (scrollableRef.current) {
              scrollableRef.current.scrollTop =
                scrollableRef.current.scrollHeight;
            }
          }}
        />

        {errors.blockExplorerUrl?.msg ? (
          <HelpText
            severity={HelpTextSeverity.Danger}
            data-testid="network-form-block-explorer-url-error"
          >
            {errors.blockExplorerUrl.msg}
          </HelpText>
        ) : null}
      </Box>
      <Box
        className="networks-tab__network-form__footer"
        backgroundColor={BackgroundColor.backgroundDefault}
        textAlign={TextAlign.Center}
        paddingTop={4}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
      >
        <ButtonPrimary
          disabled={Object.values(errors).some((e) => e)}
          onClick={onSubmit}
          size={ButtonPrimarySize.Lg}
          width={BlockSize.Full}
          alignItems={AlignItems.center}
        >
          {t('save')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

function toHex(value: string) {
  if (isStrictHexString(value)) {
    return value;
  } else if (/^\d+$/u.test(value)) {
    return `0x${decimalToHex(value)}`;
  }
  return undefined;
}

// function toDecimal(value: string) {
//   if (isStrictHexString(value)) {
//     return hexToDecimal(value);
//   } else if (/^\d+$/u.test(value)) {
//     return value
//   } else {
//     return undefined;
//   }
// }

export default NetworksForm;
