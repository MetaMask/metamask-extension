import React, { useCallback, useContext, useMemo, useState } from 'react';
import { CaipChainId } from '@metamask/utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  IconName,
  ButtonIcon,
  ButtonIconSize,
  Checkbox,
  IconSize,
  ButtonPrimary,
  ButtonPrimarySize,
  Text,
  Icon,
} from '../../../component-library';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
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
  const trackEvent = useContext(MetaMetricsContext);
  const allNetworks = [...nonTestNetworks, ...testNetworks];

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

  return (
    <Page
      data-testid="modal-page"
      className="main-container connect-page"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Header
        paddingTop={8}
        paddingBottom={0}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={onClose}
            data-testid="back-button"
          />
        }
        textProps={{
          variant: TextVariant.headingSm,
        }}
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
            label={t('selectAll')}
            isChecked={checked}
            gap={4}
            onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
            isIndeterminate={isIndeterminate}
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
                isChecked={selectedChainIds.includes(network.caipChainId)}
              />
            }
          />
        ))}
        <Box padding={4}>
          <Text variant={TextVariant.bodyMdMedium}>{t('testnets')}</Text>
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
                isChecked={selectedChainIds.includes(network.caipChainId)}
              />
            }
            showEndAccessory={false}
          />
        ))}
      </Content>
      <Footer>
        {selectedChainIds.length === 0 ? (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
            alignItems={AlignItems.center}
            width={BlockSize.Full}
          >
            <Box
              display={Display.Flex}
              gap={1}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
            >
              <Icon
                name={IconName.Danger}
                size={IconSize.Sm}
                color={IconColor.errorDefault}
              />
              <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
                {t('disconnectMessage')}
              </Text>
            </Box>
            <ButtonPrimary
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
              size={ButtonPrimarySize.Lg}
              block
              danger
            >
              {t('disconnect')}
            </ButtonPrimary>
          </Box>
        ) : (
          <ButtonPrimary
            data-testid="connect-more-chains-button"
            onClick={() => {
              onSubmit(selectedChainIds);
              onClose();
            }}
            size={ButtonPrimarySize.Lg}
            block
          >
            {t('update')}
          </ButtonPrimary>
        )}
      </Footer>
    </Page>
  );
};
