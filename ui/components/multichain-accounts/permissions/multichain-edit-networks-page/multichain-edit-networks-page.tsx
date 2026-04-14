import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { CaipChainId } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Checkbox,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import {
  BackgroundColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { Content, Footer, Header, Page } from '../../../multichain/pages/page';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../selectors/selectors.types';
import { NetworkListItem } from '../../../multichain/network-list-item';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';

const SELECT_ALL_CHECKBOX_ID = 'multichain-edit-networks-select-all';

type MultichainEditNetworksPageProps = {
  nonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  testNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  defaultSelectedChainIds: CaipChainId[];
  onClose: () => void;
  onSubmit: (chainIds: CaipChainId[]) => void;
};

export const MultichainEditNetworksPage: React.FC<
  MultichainEditNetworksPageProps
> = ({
  nonTestNetworks,
  testNetworks,
  defaultSelectedChainIds,
  onSubmit,
  onClose,
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const allNetworks = useMemo(
    () => [...nonTestNetworks, ...testNetworks],
    [nonTestNetworks, testNetworks],
  );

  const [selectedChainIds, setSelectedChainIds] = useState(
    defaultSelectedChainIds,
  );

  const allNetworksChainIds = useMemo(() => {
    return allNetworks.map(({ caipChainId }) => caipChainId);
  }, [allNetworks]);

  const selectAll = useCallback(() => {
    setSelectedChainIds(allNetworksChainIds);
  }, [allNetworksChainIds]);

  const deselectAll = () => {
    setSelectedChainIds([]);
  };

  const handleNetworkClick = useCallback(
    (chainId: CaipChainId) => {
      if (selectedChainIds.includes(chainId)) {
        setSelectedChainIds(
          selectedChainIds.filter((_chainId) => _chainId !== chainId),
        );
      } else {
        setSelectedChainIds([...selectedChainIds, chainId]);
      }
    },
    [selectedChainIds],
  );

  const allAreSelected = useMemo(() => {
    return allNetworks.length === selectedChainIds.length;
  }, [allNetworks, selectedChainIds]);

  const checked = allAreSelected;
  const isIndeterminate = !checked && selectedChainIds.length > 0;

  const defaultChainIdsSet = new Set(defaultSelectedChainIds);
  const selectedChainIdsSet = new Set(selectedChainIds);

  useLayoutEffect(() => {
    const el = document.getElementById(SELECT_ALL_CHECKBOX_ID);
    if (el instanceof HTMLInputElement) {
      el.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <Page
      data-testid="modal-page"
      className="main-container connect-page"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={onClose}
            data-testid="back-button"
          />
        }
      >
        {t('editNetworksTitle')}
      </Header>
      <Content
        paddingLeft={4}
        paddingRight={4}
        backgroundColor={BackgroundColor.transparent}
      >
        <Box padding={4}>
          <Checkbox
            id={SELECT_ALL_CHECKBOX_ID}
            label={t('selectAll')}
            isSelected={checked}
            className="gap-4"
            onChange={() => {
              if (allAreSelected) {
                deselectAll();
              } else {
                selectAll();
              }
            }}
          />
        </Box>
        {nonTestNetworks.map((network) => (
          <NetworkListItem
            name={network.name}
            iconSrc={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
            key={network.caipChainId}
            onClick={() => {
              handleNetworkClick(network.caipChainId);
            }}
            startAccessory={
              <Checkbox
                id={`multichain-edit-networks-chain-${network.caipChainId.replaceAll(
                  ':',
                  '-',
                )}`}
                isSelected={selectedChainIds.includes(network.caipChainId)}
                onChange={() => handleNetworkClick(network.caipChainId)}
              />
            }
          />
        ))}
        <Box padding={4}>
          <Text variant={DsTextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('testnets')}
          </Text>
        </Box>
        {testNetworks.map((network) => (
          <NetworkListItem
            name={network.name}
            iconSrc={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.caipChainId]}
            key={network.caipChainId}
            onClick={() => {
              handleNetworkClick(network.caipChainId);
            }}
            startAccessory={
              <Checkbox
                id={`multichain-edit-networks-testnet-${network.caipChainId.replaceAll(
                  ':',
                  '-',
                )}`}
                isSelected={selectedChainIds.includes(network.caipChainId)}
                onChange={() => handleNetworkClick(network.caipChainId)}
              />
            }
            showEndAccessory={false}
          />
        ))}
      </Content>
      <Footer>
        {selectedChainIds.length === 0 ? (
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            alignItems={BoxAlignItems.Center}
            className="w-full"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              gap={1}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
            >
              <Icon
                name={IconName.Danger}
                size={IconSize.Sm}
                color={IconColor.ErrorDefault}
              />
              <Text
                variant={DsTextVariant.BodySm}
                color={TextColor.ErrorDefault}
              >
                {t('disconnectMessage')}
              </Text>
            </Box>
            <Button
              variant={ButtonVariant.Primary}
              data-testid="disconnect-chains-button"
              onClick={() => {
                onSubmit(selectedChainIds);
                // Get networks that are in `selectedChainIds` but not in `defaultSelectedChainIds`
                const addedNetworks = selectedChainIds.filter(
                  (chainId) => !defaultChainIdsSet.has(chainId),
                );

                // Get networks that are in `defaultSelectedChainIds` but not in `selectedChainIds`
                const removedNetworks = defaultSelectedChainIds.filter(
                  (chainId) => !selectedChainIdsSet.has(chainId),
                );

                trackEvent({
                  category: MetaMetricsEventCategory.Permissions,
                  event: MetaMetricsEventName.UpdatePermissionedNetworks,
                  properties: {
                    addedNetworks: addedNetworks.length,
                    removedNetworks: removedNetworks.length,
                    location: 'Edit Networks Modal',
                  },
                });
                onClose();
              }}
              size={ButtonSize.Lg}
              isFullWidth
              isDanger
            >
              {t('disconnect')}
            </Button>
          </Box>
        ) : (
          <Button
            variant={ButtonVariant.Primary}
            data-testid="connect-more-chains-button"
            onClick={() => {
              onSubmit(selectedChainIds);
              onClose();
            }}
            size={ButtonSize.Lg}
            isFullWidth
          >
            {t('update')}
          </Button>
        )}
      </Footer>
    </Page>
  );
};
