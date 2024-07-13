import React, { useRef, useState } from 'react';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
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

import { showModal, toggleNetworkMenu } from '../../../../store/actions';

export const RpcUrlEditor = ({
  currentRpcUrl,
  onRpcUrlAdd,
}: {
  currentRpcUrl: string;
  onRpcUrlAdd: () => void;
}) => {
  // TODO: real endpoints
  const dummyRpcUrls = [
    currentRpcUrl,
    'https://mainnet.public.blastapi.io',
    'https://infura.foo.bar.baz/123456789',
  ];

  const t = useI18nContext();
  const dispatch = useDispatch();
  const rpcDropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
          iconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
          ariaLabel={t('defaultRpcUrl')}
          size={ButtonIconSize.Sm}
        />
      </Box>
      <Popover
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={0}
        matchWidth={true}
        paddingRight={0}
        className="networks-tab__rpc-popover"
        referenceElement={rpcDropdown.current}
        position={PopoverPosition.Bottom}
        isOpen={isDropdownOpen}
      >
        {dummyRpcUrls.map((rpcEndpoint) => (
          <Box
            alignItems={AlignItems.center}
            padding={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            key={rpcEndpoint}
            onClick={() => {
              setCurrentRpcEndpoint(rpcEndpoint);
              setIsDropdownOpen(false);
            }}
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
              marginLeft={1}
              ariaLabel={t('delete')}
              size={ButtonIconSize.Sm}
              iconName={IconName.Trash}
              color={IconColor.errorDefault}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                dispatch(toggleNetworkMenu());
                dispatch(
                  showModal({
                    name: 'CONFIRM_DELETE_RPC_URL',
                  }),
                );
              }}
            />
          </Box>
        ))}
        <Box
          onClick={onRpcUrlAdd}
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
