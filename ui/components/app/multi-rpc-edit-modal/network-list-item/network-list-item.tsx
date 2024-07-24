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
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { setEditedNetwork, toggleNetworkMenu } from '../../../../store/actions';

type NetworkListItemProps = {
  item: {
    rpcUrl: string;
    nickname: string;
    rpcPrefs: {
      imageUrl: string;
    };
  };
  index: number;
  setSelectedNetwork: (network: {
    rpcUrl: string;
    nickname: string;
    rpcPrefs: {
      imageUrl: string;
    };
  }) => void;
  setActionMode: (mode: string) => void;
  rpcName: string;
};

const NetworkListItem: React.FC<NetworkListItemProps> = ({
  item,
  index,
  rpcName,
}) => {
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
      key={index}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      paddingBottom={4}
      paddingTop={4}
      className="new-network-list__list-of-networks"
    >
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        <AvatarNetwork
          size={AvatarNetworkSize.Md}
          src={item.rpcPrefs?.imageUrl}
          name={item.nickname}
        />
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box marginLeft={4}>
            <Text
              color={TextColor.textDefault}
              backgroundColor={BackgroundColor.transparent}
              ellipsis
            >
              {item.nickname}
            </Text>
          </Box>
          <Box
            className="multichain-network-list-item__rpc-endpoint"
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
            >
              {rpcName ?? new URL(item.rpcUrl).host}
            </Text>
            <Popover
              referenceElement={referenceElement}
              position={PopoverPosition.Bottom}
              isOpen={isOpenTooltip}
              matchWidth
              hasArrow
              flip
              backgroundColor={BackgroundColor.backgroundAlternative}
              paddingTop={2}
              paddingBottom={2}
            >
              <Text variant={TextVariant.bodyXsMedium} ellipsis>
                {item.rpcUrl}
              </Text>
            </Popover>
          </Box>
        </Box>
      </Box>

      <Box display={Display.Flex} alignItems={AlignItems.center} marginLeft={1}>
        <Button
          type="button"
          className="add-network__add-button"
          variant={ButtonVariant.Link}
          data-testid="test-add-button"
          onClick={() => {
            dispatch(
              toggleNetworkMenu({
                isAddingNewNetwork: false,
                isMultiRpcOnboarding: true,
              }),
            );
            dispatch(
              setEditedNetwork({
                chainId: item.chainId,
                nickname: item.nickname,
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
