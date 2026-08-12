import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SWAP_PATH } from '../../../helpers/constants/routes';
import { BRIDGE_ONLY_CHAINS } from '../../../../shared/constants/bridge';
import {
  getFromAccount,
  getFromChain,
  getFromChains,
  getFromToken,
  getIsDestAssetPickerOpen,
  getIsSrcAssetPickerOpen,
  getToChain,
  getToChains,
  getToToken,
} from '../../../ducks/bridge/selectors';
import {
  setFromToken,
  setToToken,
  setIsSrcAssetPickerOpen,
  setIsDestAssetPickerOpen,
} from '../../../ducks/bridge/actions';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { useEnsureNetworkEnabled } from '../hooks/useEnsureNetworkEnabled';
import { useDispatch } from '../../../store/hooks';

import {
  BridgeAssetPickerContent,
  type BridgeAssetPickerContentHandle,
} from './components/bridge-asset-picker/bridge-asset-picker-content';

/**
 * Full-screen version of the bridge asset picker. It is shown instead of the
 * `BridgeAssetPicker` modal when the network management feature flag is
 * enabled. The token selection logic is identical to the modal — both share
 * `BridgeAssetPickerContent`. Whether the source or destination token is being
 * picked is derived from the same redux state the modal relies on.
 */
const BridgeAssetPickerPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isSourcePickerOpen = useSelector(getIsSrcAssetPickerOpen);
  const isDestinationPickerOpen = useSelector(getIsDestAssetPickerOpen);
  const isDestination = isDestinationPickerOpen && !isSourcePickerOpen;

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChains = useSelector(getFromChains);
  const toChains = useSelector(getToChains);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const selectedAccount = useSelector(getFromAccount);

  const ensureNetworkEnabled = useEnsureNetworkEnabled();

  // For the destination picker, use the appropriate account for the
  // destination chain to mirror the modal's `accountAddress` derivation.
  const defaultDestinationAccount = useSelector((state) =>
    toChain?.chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          formatChainIdToCaip(toChain.chainId),
        )
      : null,
  );

  const contentRef = useRef<BridgeAssetPickerContentHandle>(null);

  useEffect(() => {
    return () => {
      dispatch(setIsDestAssetPickerOpen(false));
      dispatch(setIsSrcAssetPickerOpen(false));
    };
  }, [dispatch]);

  const handleClose = () => {
    dispatch(setIsDestAssetPickerOpen(false));
    dispatch(setIsSrcAssetPickerOpen(false));
    navigate(SWAP_PATH, { replace: true });
  };

  const selectedAsset = isDestination ? toToken : fromToken;
  const networks = isDestination ? toChains : fromChains;
  const accountAddress = isDestination
    ? (defaultDestinationAccount?.address ?? selectedAccount?.address)
    : selectedAccount?.address;
  // If the fromChain is a bridge-only chain, disable it in the toChain picker
  const disabledChainId =
    isDestination &&
    fromChain?.chainId &&
    BRIDGE_ONLY_CHAINS.includes(fromChain.chainId)
      ? fromChain.chainId
      : undefined;

  return (
    <Page className="bridge__container">
      <Header
        textProps={{ variant: TextVariant.headingSm }}
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            onClick={() => contentRef.current?.handleClose()}
          />
        }
      >
        {t('swapSelectToken')}
      </Header>
      <Content
        padding={0}
        paddingBottom={4}
        height={BlockSize.Full}
        gap={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <BridgeAssetPickerContent
          ref={contentRef}
          isOpen
          onClose={handleClose}
          selectedAsset={selectedAsset}
          accountAddress={accountAddress}
          chains={networks}
          disabledChainId={disabledChainId}
          isDestination={isDestination}
          onAssetChange={async (asset) => {
            await ensureNetworkEnabled(asset.chainId);
            dispatch(isDestination ? setToToken(asset) : setFromToken(asset));
          }}
        />
      </Content>
    </Page>
  );
};

export default BridgeAssetPickerPage;
