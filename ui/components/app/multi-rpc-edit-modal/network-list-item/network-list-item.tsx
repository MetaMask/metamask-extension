import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  Button,
  Popover,
  PopoverPosition,
  ButtonVariant,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
  TextAlign,
  JustifyContent,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { setEditedNetwork, toggleNetworkMenu } from '../../../../store/actions';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';

// TODO: Use version from network controller with v21 upgrade
enum RpcEndpointType {
  Custom = 'custom',
  Infura = 'infura',
}

const NetworkListItem = ({
  networkConfiguration,
}: {
  // TODO: `NetworkConfiguration` with network controller v21 upgrade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkConfiguration: any;
}) => {
  const rpcEndpoint =
    networkConfiguration.rpcEndpoints[
      networkConfiguration.defaultRpcEndpointIndex
    ];

  const t = useI18nContext();
  const [isOpenTooltip, setIsOpenTooltip] = useState(false);
  const dispatch = useDispatch();

  const [referenceElement, setReferenceElement] =
    useState<HTMLElement | null>();
  const setBoxRef = (anchorRef: HTMLElement | null) => {
    setReferenceElement(anchorRef);
  };

  const handleMouseEnter = () => {
    setIsOpenTooltip(true);
  };

  const handleMouseLeave = () => {
    setIsOpenTooltip(false);
  };

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      paddingBottom={4}
      paddingTop={4}
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        width={BlockSize.EightTwelfths}
      >
        <AvatarNetwork
          size={AvatarNetworkSize.Md}
          src={
            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
              networkConfiguration.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
            ]
          }
          name={networkConfiguration.name}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.ElevenTwelfths}
        >
          <Box marginLeft={4}>
            <Text
              color={TextColor.textDefault}
              backgroundColor={BackgroundColor.transparent}
              ellipsis
            >
              {networkConfiguration.name}
            </Text>
          </Box>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            marginLeft={4}
          >
            <Text
              padding={0}
              backgroundColor={BackgroundColor.transparent}
              as="button"
              variant={TextVariant.bodySmMedium}
              color={TextColor.textAlternative}
              ref={setBoxRef}
              style={{ width: 220 }}
              textAlign={TextAlign.Left}
              onMouseLeave={handleMouseLeave}
              onMouseOver={handleMouseEnter}
              ellipsis
            >
              {rpcEndpoint.name ?? new URL(rpcEndpoint.url).host}
            </Text>
            <Popover
              referenceElement={referenceElement}
              position={PopoverPosition.Bottom}
              isOpen={isOpenTooltip}
              hasArrow
              backgroundColor={BackgroundColor.backgroundAlternative}
              paddingTop={2}
              paddingBottom={2}
            >
              <Text variant={TextVariant.bodyXsMedium} ellipsis>
                {rpcEndpoint.type === RpcEndpointType.Infura
                  ? rpcEndpoint.url.replace('/v3/{infuraProjectId}', '')
                  : rpcEndpoint.url}
              </Text>
            </Popover>
          </Box>
        </Box>
      </Box>

      <Box display={Display.Flex} alignItems={AlignItems.center} marginLeft={1}>
        <Button
          type="button"
          variant={ButtonVariant.Link}
          onClick={() => {
            dispatch(
              toggleNetworkMenu({
                isAddingNewNetwork: false,
                isMultiRpcOnboarding: true,
              }),
            );
            dispatch(
              setEditedNetwork({
                chainId: networkConfiguration.chainId,
                nickname: networkConfiguration.name,
              }),
            );
          }}
        >
          {t('edit')}
        </Button>
      </Box>
    </Box>
  );
};

export default NetworkListItem;
