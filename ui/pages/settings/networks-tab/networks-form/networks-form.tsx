import log from 'loglevel';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { Hex, isStrictHexString } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
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
import { getNetworkConfigurationsByChainId } from '../../../../selectors';
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
  FormTextField,
  FormTextFieldSize,
  HelpText,
  HelpTextSeverity,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import RpcListItem, {
  stripKeyFromInfuraUrl,
  stripProtocol,
} from '../../../../components/multichain/network-list-menu/rpc-list-item';
import {
  DropdownEditor,
  DropdownEditorStyle,
} from '../../../../components/multichain/dropdown-editor/dropdown-editor';
import { useSafeChains, rpcIdentifierUtility } from './use-safe-chains';
import { useNetworkFormState } from './networks-form-state';

export const NetworksForm = ({
  networkFormState,
  existingNetwork,
  onRpcAdd,
  onBlockExplorerAdd,
}: {
  networkFormState: ReturnType<typeof useNetworkFormState>;
  existingNetwork?: NetworkConfiguration;
  onRpcAdd: () => void;
  onBlockExplorerAdd: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const scrollableRef = useRef<HTMLDivElement>(null);
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
    const chainIdHex = chainId ? toHex(chainId) : undefined;
    const expectedName = chainIdHex
      ? NETWORK_TO_NAME_MAP[chainIdHex as keyof typeof NETWORK_TO_NAME_MAP] ??
        safeChains?.find((chain) => toHex(chain.chainId) === chainIdHex)?.name
      : undefined;

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
    const chainIdHex = chainId ? toHex(chainId) : undefined;
    const expectedSymbol = chainIdHex
      ? CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
          chainIdHex as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
        ] ??
        safeChains?.find((chain) => toHex(chain.chainId) === chainIdHex)
          ?.nativeCurrency?.symbol
      : undefined;

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
    let error: [string, string] | undefined;

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

    const chainIdHex = toHex(chainId);

    if (!error && !existingNetwork) {
      const matchingNetwork = chainIdHex
        ? networkConfigurations[chainIdHex]
        : undefined;
      if (matchingNetwork) {
        error = [
          'existingChainId',
          t('chainIdExistsErrorMsg', [matchingNetwork.name]),
        ];
      }
    }

    let rpcError: [string, string] | undefined;
    if (fetchedChainId && chainIdHex && fetchedChainId !== chainIdHex) {
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
      rpcUrls?.rpcEndpoints?.[rpcUrls?.defaultRpcEndpointIndex ?? -1]?.url;

    if (rpcUrl) {
      jsonRpcRequest(templateInfuraRpc(rpcUrl), 'eth_chainId')
        .then((response) => {
          setFetchedChainId(response as string);
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
      const chainIdHex = chainId ? toHex(chainId) : undefined;
      if (chainIdHex === CHAIN_IDS.GOERLI) {
        dispatch(showDeprecatedNetworkModal());
      } else if (chainIdHex) {
        const networkPayload = {
          chainId: chainIdHex,
          name,
          nativeCurrency: ticker,
          rpcEndpoints: rpcUrls?.rpcEndpoints,
          defaultRpcEndpointIndex: rpcUrls?.defaultRpcEndpointIndex ?? 0,
          blockExplorerUrls: blockExplorers?.blockExplorerUrls,
          defaultBlockExplorerUrlIndex:
            blockExplorers?.defaultBlockExplorerUrlIndex,
        };

        if (existingNetwork) {
          const options = {
            replacementSelectedRpcEndpointIndex:
              chainIdHex === existingNetwork.chainId
                ? rpcUrls?.defaultRpcEndpointIndex
                : undefined,
          };
          await dispatch(updateNetwork(networkPayload, options));
        } else {
          await dispatch(addNetwork(networkPayload));
        }

        trackEvent({
          event: MetaMetricsEventName.CustomNetworkAdded,
          category: MetaMetricsEventCategory.Network,
          properties: {
            block_explorer_url:
              blockExplorers?.blockExplorerUrls?.[
                blockExplorers?.defaultBlockExplorerUrlIndex ?? -1
              ],
            chain_id: chainIdHex,
            network_name: name,
            source_connection_method:
              MetaMetricsNetworkEventSource.CustomNetworkForm,
            token_symbol: ticker,
          },
          sensitiveProperties: {
            rpcUrl: rpcIdentifierUtility(
              rpcUrls?.rpcEndpoints[rpcUrls.defaultRpcEndpointIndex ?? -1]?.url,
              safeChains ?? [],
            ),
          },
        });

        dispatch(
          setEditedNetwork({
            chainId: chainIdHex,
            nickname: name,
            editCompleted: true,
            newNetwork: !existingNetwork,
          }),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(toggleNetworkMenu());
    }
  };

  return (
    <Box
      height={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      ref={scrollableRef}
      className="networks-tab__scrollable"
    >
      <Box
        width={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={2}
      >
        <FormTextField
          id="networkName"
          size={FormTextFieldSize.Lg}
          placeholder={t('enterNetworkName')}
          data-testid="network-form-name-input"
          autoFocus
          helpText={
            ((name && warnings?.name?.msg) || suggestedName) && (
              <>
                {name && warnings?.name?.msg && (
                  <HelpText
                    variant={TextVariant.bodySm}
                    severity={HelpTextSeverity.Warning}
                  >
                    {warnings.name.msg}
                  </HelpText>
                )}

                {suggestedName && (
                  <Text
                    as="span"
                    variant={TextVariant.bodySm}
                    color={TextColor.textDefault}
                    data-testid="network-form-name-suggestion"
                  >
                    {t('suggestedTokenName')}
                    <ButtonLink
                      as="button"
                      variant={TextVariant.bodySm}
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
            )
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e: any) => {
            setName(e.target?.value);
          }}
          label={t('networkName')}
          labelProps={{
            children: undefined,
            variant: TextVariant.bodyMdMedium,
          }}
          textFieldProps={{
            borderRadius: BorderRadius.LG,
          }}
          inputProps={{
            'data-testid': 'network-form-network-name',
          }}
          value={name}
        />
        <DropdownEditor
          title={t('defaultRpcUrl')}
          placeholder={t('addAUrl')}
          style={DropdownEditorStyle.PopoverStyle}
          items={rpcUrls.rpcEndpoints}
          itemKey={(endpoint) => endpoint.url}
          selectedItemIndex={rpcUrls.defaultRpcEndpointIndex}
          error={Boolean(errors.rpcUrl)}
          buttonDataTestId="test-add-rpc-drop-down"
          renderItem={(item, isList) =>
            isList || item?.name || item?.type === RpcEndpointType.Infura ? (
              <RpcListItem rpcEndpoint={item} />
            ) : (
              <Text
                ellipsis
                variant={TextVariant.bodyMd}
                paddingTop={3}
                paddingBottom={3}
              >
                {stripProtocol(stripKeyFromInfuraUrl(item.url))}
              </Text>
            )
          }
          renderTooltip={(item, isList) => {
            const url = stripKeyFromInfuraUrl(item.url);
            return url.length > (isList ? 37 : 35) ? url : undefined;
          }}
          addButtonText={t('addRpcUrl')}
          itemIsDeletable={(item) => item.type !== RpcEndpointType.Infura}
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
              variant={TextVariant.bodySm}
              severity={HelpTextSeverity.Danger}
              data-testid="network-form-chain-id-error"
            >
              {errors.rpcUrl?.msg}
            </HelpText>
          </Box>
        )}
        <FormTextField
          id="chainId"
          size={FormTextFieldSize.Lg}
          placeholder={t('enterChainId')}
          paddingTop={4}
          data-testid="network-form-chain-id-input"
          onChange={(e) => {
            setChainId(e.target?.value.trim());
          }}
          error={Boolean(errors?.chainId)}
          label={t('chainId')}
          labelProps={{
            children: undefined,
            variant: TextVariant.bodyMdMedium,
          }}
          textFieldProps={{
            borderRadius: BorderRadius.LG,
          }}
          inputProps={{
            'data-testid': 'network-form-chain-id',
          }}
          value={chainId}
          disabled={Boolean(existingNetwork)}
        />

        {errors.chainId?.msg ? (
          <HelpText
            variant={TextVariant.bodySm}
            severity={HelpTextSeverity.Danger}
            data-testid="network-form-chain-id-error"
          >
            {errors.chainId.msg}
          </HelpText>
        ) : null}
        {errors.chainId?.key === 'existingChainId' ? (
          <Box>
            <HelpText
              variant={TextVariant.bodySm}
              severity={HelpTextSeverity.Danger}
              data-testid="network-form-chain-id-error"
            >
              {t('updateOrEditNetworkInformations')}{' '}
              <ButtonLink
                as="button"
                variant={TextVariant.bodySm}
                color={TextColor.primaryDefault}
                onClick={() => {
                  const chainIdHex = toHex(chainId);
                  if (chainIdHex) {
                    dispatch(
                      setEditedNetwork({
                        chainId: chainIdHex,
                      }),
                    );
                  }
                }}
              >
                {t('editNetworkLink')}
              </ButtonLink>
            </HelpText>
          </Box>
        ) : null}
        <FormTextField
          id="nativeCurrency"
          size={FormTextFieldSize.Lg}
          placeholder={t('enterSymbol')}
          paddingTop={4}
          data-testid="network-form-ticker"
          helpText={
            suggestedTicker ? (
              <Text
                as="span"
                variant={TextVariant.bodySm}
                color={TextColor.textDefault}
                data-testid="network-form-ticker-suggestion"
              >
                {t('suggestedCurrencySymbol')}
                <ButtonLink
                  as="button"
                  variant={TextVariant.bodySm}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e: any) => {
            setTicker(e.target?.value);
          }}
          label={t('currencySymbol')}
          labelProps={{
            children: undefined,
            variant: TextVariant.bodyMdMedium,
          }}
          textFieldProps={{
            borderRadius: BorderRadius.LG,
          }}
          inputProps={{
            'data-testid': 'network-form-ticker-input',
          }}
          value={ticker}
        />
        {ticker && warnings.ticker?.msg ? (
          <HelpText
            variant={TextVariant.bodySm}
            severity={HelpTextSeverity.Warning}
            data-testid="network-form-ticker-warning"
          >
            {warnings.ticker.msg}
          </HelpText>
        ) : null}

        <DropdownEditor
          title={t('blockExplorerUrl')}
          placeholder={t('addAUrl')}
          style={DropdownEditorStyle.BoxStyle}
          items={blockExplorers.blockExplorerUrls}
          itemKey={(item) => `${item}`}
          selectedItemIndex={blockExplorers.defaultBlockExplorerUrlIndex}
          addButtonText={t('addBlockExplorerUrl')}
          onItemAdd={onBlockExplorerAdd}
          buttonDataTestId="test-explorer-drop-down"
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
          // Scroll to bottom so all URLs are visible
          onDropdownOpened={() => {
            if (scrollableRef.current) {
              scrollableRef.current.scrollTop =
                scrollableRef.current.scrollHeight;
            }
          }}
          renderItem={(item) => (
            <Text
              as="button"
              paddingLeft={0}
              paddingRight={0}
              paddingTop={3}
              paddingBottom={3}
              color={TextColor.textDefault}
              variant={TextVariant.bodyMd}
              backgroundColor={BackgroundColor.transparent}
              ellipsis
            >
              {stripProtocol(item)}
            </Text>
          )}
          renderTooltip={(item) => (item.length > 36 ? item : undefined)}
        />
      </Box>
      <Box
        className="networks-tab__network-form__footer"
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        width={BlockSize.Full}
      >
        <ButtonPrimary
          data-testid='network-form-save'
          disabled={
            !name ||
            !chainId ||
            !ticker ||
            !rpcUrls?.rpcEndpoints?.length ||
            Object.values(errors).some((e) => e)
          }
          onClick={onSubmit}
          size={ButtonPrimarySize.Lg}
          width={BlockSize.Full}
        >
          {t('save')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

function toHex(value: string): Hex | undefined {
  if (isStrictHexString(value)) {
    return value;
  } else if (/^\d+$/u.test(value)) {
    return `0x${decimalToHex(value)}`;
  }
  return undefined;
}

export default NetworksForm;
