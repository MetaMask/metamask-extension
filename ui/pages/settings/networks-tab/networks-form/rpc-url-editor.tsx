import React, { useRef, useState } from 'react';
import classnames from 'classnames';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { RpcEndpoint } from '@metamask/network-controller/dist/types/NetworkController';
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
import { infuraProjectId } from '../../../../../shared/constants/network';

export const URLEditor = ({
  endpointsList,
  indexUsedEndpoint,
  title,
  buttonTitle,
  onUrlAdd,
  onRpcUrlDeleted,
  onRpcUrlSelected,
  onExplorerUrlSelected,
  setRpcUrls,
  setBlockExplorerUrl,
  onExplorerUrlDeleted,
  isRpc,
}: {
  chainId: string;
  endpointsList: RpcEndpoint[];
  indexUsedEndpoint: number;
  title: string;
  buttonTitle: string;
  onUrlAdd: () => void;
  onRpcUrlDeleted: (url: string) => void;
  onRpcUrlSelected: (url: string) => void;
  onExplorerUrlSelected: (url: string) => void;
  setBlockExplorerUrl: (url: string) => void;
  onExplorerUrlDeleted: (url: string) => void;
  setRpcUrls: (url: string) => void;
  isRpc: boolean;
}) => {
  const t = useI18nContext();

  const rpcDropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const defaultRpcUrl = isRpc
    ? endpointsList?.[indexUsedEndpoint]?.url ?? ''
    : endpointsList?.[indexUsedEndpoint] ?? '';

  const stripKey = (url: string) => {
    if (url.endsWith('/v3/{infuraProjectId}')) {
      return url.replace('/v3/{infuraProjectId}', '');
    }
    if (url.endsWith(`/v3/${infuraProjectId}`)) {
      return url.replace(`/v3/${infuraProjectId}`, '');
    }
    return url;
  };
  const listRpc = endpointsList || [];

  console.log('listRpc ------', listRpc);
  console.log('indexUsedEndpoint ------', indexUsedEndpoint);

  return (
    <>
      <Text
        className="networks-tab__rpc-header"
        marginTop={1}
        marginBottom={1}
        variant={TextVariant.bodySmBold}
      >
        {title}
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
        <Text variant={TextVariant.bodySm}>{stripKey(defaultRpcUrl)}</Text>
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
        onClickOutside={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {listRpc.map((endpoint) => (
          <Box
            alignItems={AlignItems.center}
            padding={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            key={isRpc ? endpoint.url : endpoint}
            onClick={() => {
              if (isRpc) {
                onRpcUrlSelected(endpoint.url);
                setRpcUrls(isRpc ? endpoint.url : endpoint);
                setIsDropdownOpen(false);
                return;
              }
              onExplorerUrlSelected(endpoint);
              setBlockExplorerUrl(endpoint);
              setIsDropdownOpen(false);
            }}
            className={classnames('networks-tab__rpc-item', {
              'networks-tab__rpc-item--selected': isRpc
                ? endpoint.url === defaultRpcUrl
                : endpoint === defaultRpcUrl,
            })}
          >
            {endpoint.url === defaultRpcUrl ||
              (endpoint === defaultRpcUrl && (
                <Box
                  className="networks-tab__rpc-selected-pill"
                  borderRadius={BorderRadius.pill}
                  backgroundColor={BackgroundColor.primaryDefault}
                />
              ))}
            <Text
              as="button"
              color={TextColor.textDefault}
              variant={TextVariant.bodySmMedium}
              backgroundColor={BackgroundColor.transparent}
              ellipsis
            >
              {isRpc ? stripKey(endpoint.url) : endpoint}
            </Text>

            {(!isRpc || (endpointsList.length > 1 && endpoint.type !== RpcEndpointType.Infura )) && (
              <ButtonIcon
                marginLeft={1}
                ariaLabel={t('delete')}
                size={ButtonIconSize.Sm}
                iconName={IconName.Trash}
                color={IconColor.errorDefault}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (isRpc) {
                    onRpcUrlDeleted(endpoint.url);
                  }
                  onExplorerUrlDeleted(endpoint);
                }}
              />
            )}
          </Box>
        ))}
        <Box
          onClick={onUrlAdd}
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
            {buttonTitle}
          </Text>
        </Box>
      </Popover>
    </>
  );
};

export default URLEditor;
