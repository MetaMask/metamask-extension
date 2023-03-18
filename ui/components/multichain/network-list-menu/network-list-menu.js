import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Popover from '../../ui/popover/popover.component';
import { NetworkListItem } from '../network-list-item';
import { setActiveNetwork, showModal } from '../../../store/actions';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import Box from '../../ui/box/box';

export const NetworkListMenu = () => {
  const t = useI18nContext();
  const networks = useSelector((state) => state.metamask.networkConfigurations);
  const provider = useSelector((state) => state.metamask.provider);
  const dispatch = useDispatch();

  return (
    <Popover title={t('networkMenuHeading')}>
      <Box>
        {Object.entries(networks).map(([networkConfigurationId, network]) => {
          const isCurrentNetwork =
            provider.type === NETWORK_TYPES.RPC &&
            network.rpcUrl === provider.rpcUrl;
          return (
            <NetworkListItem
              name={network.nickname}
              key={networkConfigurationId}
              selected={isCurrentNetwork}
              onClick={() => setActiveNetwork(networkConfigurationId)}
              onDeleteClick={
                isCurrentNetwork
                  ? null
                  : () => {
                      dispatch(
                        showModal({
                          name: 'CONFIRM_DELETE_NETWORK',
                          target: network.id,
                          onConfirm: () => undefined,
                        }),
                      );
                    }
              }
            />
          );
        })}
      </Box>
    </Popover>
  );
};

/*

network-configuration-id-1': {
        chainId: '0x539',
        nickname: 'Localhost 8545',
        rpcPrefs: {},
        rpcUrl: 'http://localhost:8545',
        ticker: 'ETH',
      },


*/
