import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EthScope } from '@metamask/keyring-api';
import { type AddNetworkFields } from '@metamask/network-controller';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type CaipChainId } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS,
} from '../../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getFilteredFeaturedNetworks,
  getNetworkIcon,
  sortNetworks,
} from '../../../../../../shared/lib/network.utils';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  addNetwork,
  setEnabledAllPopularNetworks,
  showModal,
} from '../../../../../store/actions';
import {
  getAllEnabledNetworksForAllNamespaces,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../../../selectors/multichain/networks';
import {
  getOrderedNetworksList,
  getShowTestNetworks,
  getUseExternalServices,
} from '../../../../../selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../../selectors/multichain-accounts/account-tree';
import { selectAdditionalNetworksBlacklistFeatureFlag } from '../../../../../selectors/network-blacklist/network-blacklist';
import { useIsNetworkGasSponsored } from '../../../../../hooks/useIsNetworkGasSponsored';
import { useNetworkManagerState } from '../../../../multichain/network-manager/hooks/useNetworkManagerState';
import { useNetworkChangeHandlers } from '../../../../multichain/network-manager/hooks/useNetworkChangeHandlers';

type HomeNetworkFilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type HomeNetworkFilterModalContentProps = {
  onClose: () => void;
};

type NetworkRowProps = {
  name: string;
  iconSrc?: string | IconName;
  chainId?: string;
  selected?: boolean;
  endIconName?: IconName;
  onClick: () => void;
  testId: string;
};

const getSelectableChainId = (network: MultichainNetworkConfiguration) =>
  network.isEvm ? convertCaipToHexChainId(network.chainId) : network.chainId;

const isIconName = (iconSrc?: string | IconName): iconSrc is IconName =>
  Object.values(IconName).includes(iconSrc as IconName);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <Text
    variant={TextVariant.BodyMd}
    color={TextColor.TextAlternative}
    fontWeight={FontWeight.Medium}
    className="px-4 py-2"
  >
    {children}
  </Text>
);

const HomeNetworkFilterRow = ({
  name,
  iconSrc,
  chainId,
  selected = false,
  endIconName,
  onClick,
  testId,
}: NetworkRowProps) => {
  const t = useI18nContext();
  const { isNetworkGasSponsored } = useIsNetworkGasSponsored(chainId);

  return (
    <button
      type="button"
      className={`flex min-h-16 w-full cursor-pointer items-center justify-between border-0 p-4 text-left hover:bg-hover ${
        selected ? 'bg-muted' : 'bg-transparent'
      }`}
      data-testid={testId}
      onClick={onClick}
    >
      <Box
        className="flex min-w-0 items-center gap-3"
      >
        {isIconName(iconSrc) ? (
          <Icon name={iconSrc} size={IconSize.Sm} color={IconColor.IconDefault} />
        ) : (
          <AvatarNetwork name={name} src={iconSrc} size={AvatarNetworkSize.Md} />
        )}
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Medium}
          className="truncate"
        >
          {name}
        </Text>
        {isNetworkGasSponsored && (
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.SuccessDefault}
            fontWeight={FontWeight.Medium}
            className="whitespace-nowrap rounded bg-success-muted px-1 py-0.5"
          >
            {t('noNetworkFee')}
          </Text>
        )}
      </Box>
      {(selected || endIconName) && (
        <Icon
          name={selected ? IconName.Check : (endIconName as IconName)}
          size={IconSize.Sm}
          color={IconColor.IconDefault}
        />
      )}
    </button>
  );
};

const HomeNetworkFilterModalContent = ({
  onClose,
}: HomeNetworkFilterModalContentProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const [, evmNetworks] = useSelector(getMultichainNetworkConfigurationsByChainId);
  const enabledNetworks = useSelector(getAllEnabledNetworksForAllNamespaces);
  const useExternalServices = useSelector(getUseExternalServices);
  const showTestnets = useSelector(getShowTestNetworks);
  const blacklistedChainIds = useSelector(
    selectAdditionalNetworksBlacklistFeatureFlag,
  );
  const evmAccountGroup = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa),
  );
  const { handleNetworkChange } = useNetworkChangeHandlers();
  const { nonTestNetworks: allDefaultNetworkMap, isNetworkInDefaultNetworkTab } =
    useNetworkManagerState({ showDefaultNetworks: true });
  const { nonTestNetworks: customNetworkMap, testNetworks: testNetworkMap } =
    useNetworkManagerState();

  const enabledNetworkSet = useMemo(
    () => new Set(enabledNetworks),
    [enabledNetworks],
  );

  const isAllDefaultSelected = enabledNetworks.length > 1;

  const isNetworkSelected = useCallback(
    (network: MultichainNetworkConfiguration) =>
      enabledNetworks.length === 1 &&
      enabledNetworkSet.has(getSelectableChainId(network)),
    [enabledNetworkSet, enabledNetworks.length],
  );

  const defaultNetworks = useMemo(() => {
    return sortNetworks(allDefaultNetworkMap, orderedNetworksList).filter(
      (network) => {
        if (!isNetworkInDefaultNetworkTab(network)) {
          return false;
        }

        if (!useExternalServices && !network.isEvm) {
          return false;
        }

        return network.isEvm ? Boolean(evmAccountGroup) : true;
      },
    );
  }, [
    allDefaultNetworkMap,
    evmAccountGroup,
    isNetworkInDefaultNetworkTab,
    orderedNetworksList,
    useExternalServices,
  ]);

  const customNetworks = useMemo(() => {
    return sortNetworks(customNetworkMap, orderedNetworksList).filter(
      (network) => useExternalServices || network.isEvm,
    );
  }, [customNetworkMap, orderedNetworksList, useExternalServices]);

  const testNetworks = useMemo(() => {
    return sortNetworks(testNetworkMap, orderedNetworksList).filter(
      (network) => useExternalServices || network.isEvm,
    );
  }, [orderedNetworksList, testNetworkMap, useExternalServices]);

  const additionalNetworks = useMemo(() => {
    const availableNetworks = FEATURED_RPCS.filter(
      ({ chainId }) => !evmNetworks[chainId],
    ).filter(
      ({ chainId }) =>
        useExternalServices || isEvmChainId(chainId as CaipChainId),
    );

    return getFilteredFeaturedNetworks(
      blacklistedChainIds,
      availableNetworks,
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [blacklistedChainIds, evmNetworks, useExternalServices]);

  const handleSelectAllDefaultNetworks = useCallback(() => {
    dispatch(setEnabledAllPopularNetworks());
    onClose();
  }, [dispatch, onClose]);

  const handleSelectNetwork = useCallback(
    async (chainId: CaipChainId) => {
      await handleNetworkChange(chainId);
      onClose();
    },
    [handleNetworkChange, onClose],
  );

  const handleAddNetwork = useCallback(
    async (network: AddNetworkFields) => {
      await dispatch(addNetwork(network));
      onClose();
    },
    [dispatch, onClose],
  );

  const handleManageNetworks = useCallback(() => {
    onClose();
    dispatch(showModal({ name: 'NETWORK_MANAGER' }));
  }, [dispatch, onClose]);

  return (
    <ModalContent
      size={ModalContentSize.Sm}
      modalDialogProps={{
        padding: 0,
        className: 'overflow-hidden',
      }}
    >
      <ModalHeader onClose={onClose}>{t('bridgeSelectNetwork')}</ModalHeader>
      <Box
        className="max-h-[calc(100vh-168px)] overflow-y-auto"
        flexDirection={BoxFlexDirection.Column}
      >
        <HomeNetworkFilterRow
          name={t('allDefaultNetworks')}
          iconSrc={IconName.Global}
          selected={isAllDefaultSelected}
          onClick={handleSelectAllDefaultNetworks}
          testId="home-network-filter-all-default"
        />
        <SectionHeader>{t('defaultNetworks')}</SectionHeader>
        {defaultNetworks.map((network) => (
          <HomeNetworkFilterRow
            key={network.chainId}
            name={network.name}
            iconSrc={getNetworkIcon(network)}
            chainId={getSelectableChainId(network)}
            selected={isNetworkSelected(network)}
            onClick={() => handleSelectNetwork(network.chainId)}
            testId={`home-network-filter-network-${getSelectableChainId(network)}`}
          />
        ))}
        {customNetworks.length > 0 && (
          <Box className="flex flex-col">
            <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
            <SectionHeader>{t('customNetworks')}</SectionHeader>
            {customNetworks.map((network) => (
              <HomeNetworkFilterRow
                key={network.chainId}
                name={network.name}
                iconSrc={getNetworkIcon(network)}
                chainId={getSelectableChainId(network)}
                selected={isNetworkSelected(network)}
                onClick={() => handleSelectNetwork(network.chainId)}
                testId={`home-network-filter-custom-${getSelectableChainId(
                  network,
                )}`}
              />
            ))}
          </Box>
        )}
        {(showTestnets || process.env.METAMASK_DEBUG) &&
          testNetworks.length > 0 && (
            <Box className="flex flex-col">
              <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
              <SectionHeader>{t('testnets')}</SectionHeader>
              {testNetworks.map((network) => (
                <HomeNetworkFilterRow
                  key={network.chainId}
                  name={network.name}
                  iconSrc={getNetworkIcon(network)}
                  chainId={getSelectableChainId(network)}
                  selected={isNetworkSelected(network)}
                  onClick={() => handleSelectNetwork(network.chainId)}
                  testId={`home-network-filter-test-${getSelectableChainId(
                    network,
                  )}`}
                />
              ))}
            </Box>
          )}
        {additionalNetworks.length > 0 && (
          <Box className="flex flex-col">
            <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
            <SectionHeader>{t('additionalNetworks')}</SectionHeader>
            {additionalNetworks.map((network) => (
              <HomeNetworkFilterRow
                key={network.chainId}
                name={network.name}
                iconSrc={
                  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                    network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ]
                }
                chainId={network.chainId}
                endIconName={IconName.Add}
                onClick={() => handleAddNetwork(network)}
                testId={`home-network-filter-additional-${network.chainId}`}
              />
            ))}
          </Box>
        )}
      </Box>
      <Box className="px-4 pt-2">
        <Button
          data-testid="home-network-filter-manage-networks"
          className="h-10 w-full rounded-lg border-0 bg-muted hover:bg-muted-hover active:bg-muted-pressed"
          size={ButtonSize.Sm}
          variant={ButtonVariant.Secondary}
          onClick={handleManageNetworks}
        >
          <Box className="flex items-center justify-center gap-2">
            <Icon
              name={IconName.Setting}
              size={IconSize.Sm}
              color={IconColor.IconDefault}
            />
            {t('manageNetworksMenuHeading')}
          </Box>
        </Button>
      </Box>
    </ModalContent>
  );
};

export const HomeNetworkFilterModal = ({
  isOpen,
  onClose,
}: HomeNetworkFilterModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnOutsideClick
      isClosedOnEscapeKey
    >
      <ModalOverlay />
      {isOpen && <HomeNetworkFilterModalContent onClose={onClose} />}
    </Modal>
  );
};
