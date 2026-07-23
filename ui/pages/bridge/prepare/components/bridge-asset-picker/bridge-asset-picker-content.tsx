import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import {
  ButtonBase,
  ButtonBaseSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import { type CaipChainId } from '@metamask/utils';
import { getIsNetworkManagementEnabled } from '../../../../../selectors/multichain/feature-flags';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../../../shared/constants/bridge';
import { TextField } from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BorderColor,
  BorderRadius,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { getAccountGroupsByAddress } from '../../../../../selectors/multichain-accounts/account-tree';
import { getBridgeBalancesByChainId } from '../../../../../ducks/bridge/asset-selectors';
import { type BridgeAppState } from '../../../../../ducks/bridge/selectors';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import { MarketClosedModal } from '../../../../../components/app/assets/market-closed-modal';
import { useRWAToken } from '../../../hooks/useRWAToken';
import { NetworkPicker } from './network-picker';
import { BridgeAssetList } from './lazy-asset-list';

export type BridgeAssetPickerContentHandle = {
  handleClose: () => void;
};

/**
 * The shared body of the bridge asset picker. It is rendered both inside the
 * modal (`BridgeAssetPicker`) and inside the full-screen page
 * (`BridgeAssetPickerPage`) so the token selection logic stays identical
 * regardless of the surrounding container.
 *
 * The parent container owns the close action (`onClose`) and triggers the
 * guarded close via the imperative `handleClose` handle exposed through `ref`.
 */
export const BridgeAssetPickerContent = forwardRef<
  BridgeAssetPickerContentHandle,
  {
    isOpen: boolean;
    accountAddress: string;
    onClose: () => void;
    selectedAsset: BridgeToken;
  } & Pick<
    React.ComponentProps<typeof NetworkPicker>,
    'chains' | 'disabledChainId'
  > &
    Pick<
      React.ComponentProps<typeof BridgeAssetList>,
      'onAssetChange' | 'isDestination'
    >
>(
  (
    {
      chains,
      isOpen,
      onClose,
      onAssetChange,
      selectedAsset,
      accountAddress,
      disabledChainId,
      ...assetListProps
    },
    ref,
  ) => {
    const [accountGroup] = useSelector((state: BridgeAppState) =>
      getAccountGroupsByAddress(state, [accountAddress]),
    );
    const balanceByChainId = useSelector((state: BridgeAppState) =>
      accountGroup?.id
        ? getBridgeBalancesByChainId(state, accountGroup.id)
        : {},
    );

    const t = useI18nContext();
    const isNetworkManagementEnabled = useSelector(
      getIsNetworkManagementEnabled,
    );
    const { isStockToken, isTokenTradingOpen } = useRWAToken();
    const [showMarketClosedModal, setShowMarketClosedModal] = useState(false);
    const closeFromMarketCloseRef = useRef(false);

    const networkPickerButtonRef = useRef<HTMLButtonElement>(null);
    const [isNetworkPickerOpen, setIsNetworkPickerOpen] = useState(false);
    // Mirrors `isNetworkPickerOpen` for the asset picker's outside-click handler.
    // `ModalContent` registers its document `mousedown` listener once on mount,
    // so it captures a stale `isClosedOnOutsideClick`. Selecting a network in the
    // nested network modal fires `mousedown` before `click`, which would close the
    // asset picker before the selection applies. Reading this ref in `handleClose`
    // lets us ignore that close while the network picker is open.
    const isNetworkPickerOpenRef = useRef(false);
    useEffect(() => {
      isNetworkPickerOpenRef.current = isNetworkPickerOpen;
    }, [isNetworkPickerOpen]);
    // This is the network that the user has selected from the dropdown
    const [selectedChainId, setSelectedChainId] = useState<CaipChainId | null>(
      null,
    );

    const chainIds = useMemo(
      () => chains.map(({ chainId }) => chainId),
      [chains],
    );

    const chainIdsList = useMemo(() => {
      return selectedChainId ? [selectedChainId] : chainIds;
    }, [selectedChainId, chainIds]);

    const chainIdsSet = useMemo(() => {
      return new Set(chainIdsList);
    }, [chainIdsList]);

    const selectedNetworkName = selectedChainId
      ? NETWORK_TO_SHORT_NETWORK_NAME_MAP[selectedChainId]
      : t('allNetworks');

    const [searchQuery, setSearchQuery] = useState<string>('');

    // Persist selected chain id to restore the selected chain id if the modal is closed before a new token is selected
    const [persistedChainId, setPersistedChainId] =
      useState<CaipChainId | null>(selectedChainId);
    useEffect(() => {
      if (
        isOpen &&
        selectedChainId &&
        selectedAsset.chainId !== selectedChainId
      ) {
        // Restore previously selected chainId
        setSelectedChainId(
          persistedChainId && selectedAsset.chainId !== persistedChainId
            ? selectedAsset.chainId
            : persistedChainId,
        );
      }
    }, [isOpen]);

    const handleClose = useCallback(() => {
      // Ignore close attempts (e.g. the parent modal's stale outside-click
      // handler) while the network picker is open. The network picker manages
      // its own close, so the asset picker should stay open underneath it.
      if (isNetworkPickerOpenRef.current) {
        return;
      }
      if (closeFromMarketCloseRef.current) {
        closeFromMarketCloseRef.current = false;
        return;
      }
      setSearchQuery('');
      setIsNetworkPickerOpen(false);
      onClose();
    }, [onClose]);

    useImperativeHandle(ref, () => ({ handleClose }), [handleClose]);

    return (
      <>
        <div className="flex flex-col gap-4">
          <ButtonBase
            ref={networkPickerButtonRef}
            onClick={() =>
              isNetworkPickerOpen
                ? setIsNetworkPickerOpen(false)
                : setIsNetworkPickerOpen(true)
            }
            data-testid="multichain-asset-picker__network"
            size={ButtonBaseSize.Sm}
            startIconName={IconName.Filter}
            startIconProps={{ size: IconSize.Md }}
            className={`mx-4 w-max rounded-lg border border-muted bg-default px-2 hover:bg-hover active:bg-pressed ${
              selectedChainId ? 'text-primary-default' : 'text-default'
            }`}
          >
            <Text
              variant={DsTextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={
                selectedChainId
                  ? TextColor.PrimaryDefault
                  : TextColor.TextDefault
              }
              ellipsis
            >
              {selectedNetworkName}
            </Text>
          </ButtonBase>
          <NetworkPicker
            buttonElement={
              isNetworkManagementEnabled
                ? undefined
                : networkPickerButtonRef.current
            }
            isOpen={isNetworkPickerOpen}
            chains={chains}
            balanceByChainId={balanceByChainId}
            selectedChainId={selectedChainId}
            disabledChainId={disabledChainId}
            onNetworkChange={(chainId) => {
              setSelectedChainId(chainId);
              setIsNetworkPickerOpen(false);
            }}
            onClose={() => setIsNetworkPickerOpen(false)}
            testId="bridge-network-picker-popover"
          />
          <TextField
            autoFocus
            testId={'bridge-asset-picker-search-input'}
            placeholder={t('enterTokenNameOrAddress')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            borderRadius={BorderRadius.XL}
            borderWidth={1}
            borderColor={BorderColor.borderMuted}
            inputProps={{
              disableStateStyles: true,
              textVariant: TextVariant.bodyMd,
              paddingRight: 2,
              borderColor: BorderColor.borderMuted,
            }}
            style={{
              minHeight: 48,
              paddingRight: 8,
              outline: 'none',
              borderColor: BorderColor.borderMuted,
            }}
            marginInline={4}
            startAccessory={
              <Icon
                color={IconColor.IconAlternative}
                name={IconName.Search}
                size={IconSize.Md}
              />
            }
          />
        </div>

        {isNetworkManagementEnabled || !isNetworkPickerOpen ? (
          <BridgeAssetList
            accountGroupId={accountGroup?.id}
            chainIds={chainIdsSet}
            searchQuery={searchQuery.trim()}
            selectedAssetId={selectedAsset.assetId}
            onAssetChange={(asset: BridgeToken) => {
              if (isStockToken(asset) && !isTokenTradingOpen(asset)) {
                closeFromMarketCloseRef.current = true;
                setShowMarketClosedModal(true);
                return;
              }
              closeFromMarketCloseRef.current = false;
              handleClose();
              onAssetChange(asset);
              if (selectedChainId === asset.chainId) {
                setPersistedChainId(selectedChainId);
              }
            }}
            {...assetListProps}
          />
        ) : null}
        <MarketClosedModal
          isOpen={showMarketClosedModal}
          onClose={() => {
            closeFromMarketCloseRef.current = false;
            setShowMarketClosedModal(false);
          }}
        />
      </>
    );
  },
);
