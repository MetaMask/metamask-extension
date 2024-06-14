import React, { useRef, useState } from 'react';
import classnames from 'classnames';
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
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const RpcUrlEditor = ({ currentRpcUrl }: { currentRpcUrl: string }) => {
  // TODO: real endpoints
  const dummyRpcUrls = [
    currentRpcUrl,
    'https://dummy.mainnet.public.blastapi.io',
    'https://dummy.io/v3/blockchain/node/dummy',
  ];

  const t = useI18nContext();
  const rpcDropdown = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentRpcEndpoint, setCurrentRpcEndpoint] = useState(currentRpcUrl);

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
        className="networks-tab__rpc-dropdown"
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        borderRadius={BorderRadius.MD}
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        padding={2}
        ref={rpcDropdown}
      >
        <Text variant={TextVariant.bodySm}>{currentRpcEndpoint}</Text>
        <ButtonIcon
          iconName={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
          ariaLabel={t('defaultRpcUrl')}
          size={ButtonIconSize.Sm}
        />
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
        {dummyRpcUrls.map((rpcEndpoint) => (
          <Box
            padding={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            key={rpcEndpoint}
            onClick={() => setCurrentRpcEndpoint(rpcEndpoint)}
            className={classnames('networks-tab__rpc-item', {
              'networks-tab__rpc-item--selected':
                rpcEndpoint === currentRpcEndpoint,
            })}
          >
            {rpcEndpoint === currentRpcEndpoint && (
              <Box
                className="networks-tab__rpc-selected-pill"
                borderRadius={BorderRadius.pill}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            )}
            <Text
              as="button"
              color={TextColor.textDefault}
              variant={TextVariant.bodySmMedium}
              backgroundColor={BackgroundColor.transparent}
            >
              {rpcEndpoint}
            </Text>
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
          className="networks-tab__rpc-item"
        >
          <Icon
            color={IconColor.primaryDefault}
            name={IconName.Add}
            size={IconSize.Sm}
            marginRight={2}
          />
          <Text
            as="button"
            backgroundColor={BackgroundColor.transparent}
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySmMedium}
          >
            {t('addRpcUrl')}
          </Text>
        </Box>
      </Popover>
    </>
  );
};

export default RpcUrlEditor;
