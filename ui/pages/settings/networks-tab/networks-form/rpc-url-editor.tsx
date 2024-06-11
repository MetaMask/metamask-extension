import React, { useRef, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const RpcUrlEditor = () => {
  const t = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const rpcDropdown = useRef(null);

  // TODO: real endpoints
  const dummyRpcEndpoints = [
    'https://palmn-mainnet.infura.io',
    'https://palm-mainnet.public.blastapi.io',
    'https://tatum.io/v3/blockchain/node/palm',
  ];

  return (
    <>
      <Text
        className="networks-tab__rpc-header"
        marginTop={1}
        marginBottom={1}
        variant={TextVariant.bodySmBold}
      >
        {t('defaultRpcUrl')}
      </Text>
      <Box
        onClick={() => setIsOpen(!isOpen)}
        className="networks-tab__rpc-text"
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        borderRadius={BorderRadius.MD}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        padding={2}
        ref={rpcDropdown}
      >
        <Text variant={TextVariant.bodySm}>{dummyRpcEndpoints[0]}</Text>
        <Icon name={isOpen ? IconName.ArrowUp : IconName.ArrowDown} />
      </Box>
      <Popover
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={0}
        paddingRight={0}
        className="networks-tab__rpc-popover"
        referenceElement={rpcDropdown.current}
        position={PopoverPosition.Bottom}
        isOpen={isOpen}
      >
        {dummyRpcEndpoints.map((rpcEndpoint) => (
          <Box
            padding={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            key={rpcEndpoint}
            className="networks-tab__rpc-endpoint"
          >
            <Text variant={TextVariant.bodySm}>{rpcEndpoint}</Text>
            <ButtonIcon
              marginLeft={5}
              ariaLabel={t('delete')}
              size={ButtonIconSize.Sm}
              iconName={IconName.Trash}
              color={IconColor.errorDefault}
              // eslint-disable-next-line no-alert
              onClick={() => alert('TODO: delete confirmation modal')}
            />
          </Box>
        ))}
        <Box
          // eslint-disable-next-line no-alert
          onClick={() => alert('TODO: add RPC modal')}
          padding={4}
          display={Display.Flex}
          alignItems={AlignItems.center}
          className="networks-tab__rpc-add"
        >
          <Icon
            color={IconColor.primaryDefault}
            name={IconName.Add}
            size={IconSize.Sm}
          />
          <Text variant={TextVariant.bodySm} color={TextColor.primaryDefault}>
            Add RPC URL
          </Text>
        </Box>
      </Popover>
    </>
  );
};

export default RpcUrlEditor;
