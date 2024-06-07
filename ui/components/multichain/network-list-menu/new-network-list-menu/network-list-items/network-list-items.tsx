import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { NetworkListItem } from '../../../network-list-item';
import { Box, Text } from '../../../../component-library';
import {
  setActiveNetwork,
  setProviderType,
  showModal,
  setNetworkClientIdForDomain,
} from '../../../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import {
  Display,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';

const NetworkListItems = ({
  items,
  onDragEnd,
  currentNetwork,
  dispatch,
  trackEvent,
  currentChainId,
  showSearch,
  useRequestQueue,
  selectedTabOrigin,
  isFullScreen,
  onClose,
  isUnlocked,
}: any) => {
  return (
    <Box className="new-network-list-menu">
      <Box
        padding={4}
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Text>{'Enabled Networks'}</Text>
      </Box>
      {items.length === 0 ? (
        <Text paddingLeft={4} paddingRight={4} color={TextColor.textMuted}>
          {'No networks found'}
        </Text>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="networks">
            {(provided) => (
              <Box
                className="networks"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {items.map((network: any, index: number) => {
                  const isCurrentNetwork = currentNetwork.id === network.id;

                  const canDeleteNetwork =
                    isUnlocked && !isCurrentNetwork && network.removable;

                  return (
                    <Draggable
                      key={network.id}
                      draggableId={network.id}
                      index={index}
                    >
                      {(providedDrag) => (
                        <Box
                          ref={providedDrag.innerRef}
                          {...providedDrag.draggableProps}
                          {...providedDrag.dragHandleProps}
                        >
                          <NetworkListItem
                            name={network.nickname}
                            iconSrc={network?.rpcPrefs?.imageUrl}
                            key={network.id}
                            selected={isCurrentNetwork}
                            focus={isCurrentNetwork && !showSearch}
                            onClick={() => {
                              if (network.providerType) {
                                dispatch(setProviderType(network.providerType));
                              } else {
                                dispatch(setActiveNetwork(network.id));
                              }

                              if (useRequestQueue && selectedTabOrigin) {
                                setNetworkClientIdForDomain(
                                  selectedTabOrigin,
                                  network.id,
                                );
                              }

                              trackEvent({
                                event: MetaMetricsEventName.NavNetworkSwitched,
                                category: MetaMetricsEventCategory.Network,
                                properties: {
                                  location: 'Network Menu',
                                  chain_id: currentChainId,
                                  from_network: currentChainId,
                                  to_network: network.chainId,
                                },
                              });
                            }}
                            onDeleteClick={
                              canDeleteNetwork
                                ? () => {
                                    if (isFullScreen) {
                                      onClose();
                                    }
                                    dispatch(
                                      showModal({
                                        name: 'CONFIRM_DELETE_NETWORK',
                                        target: network.id,
                                        onConfirm: () => undefined,
                                      }),
                                    );
                                  }
                                : null
                            }
                          />
                        </Box>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </Box>
  );
};

export default NetworkListItems;
