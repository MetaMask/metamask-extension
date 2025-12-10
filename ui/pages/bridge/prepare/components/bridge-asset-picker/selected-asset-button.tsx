import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
} from '@metamask/design-system-react';
import {
  SelectButtonProps,
  SelectButtonSize,
} from '../../../../../components/component-library/select-button/select-button.types';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  OverflowWrap,
} from '../../../../../helpers/constants/design-system';
import { BridgeToken } from '../../../../../ducks/bridge/types';
import {
  IconName,
  SelectButton,
} from '../../../../../components/component-library';
import {
  BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../../shared/constants/bridge';

export const SelectedAssetButton = ({
  asset,
  ...props
}: {
  asset: BridgeToken;
} & SelectButtonProps<'div'>) => (
  <SelectButton
    borderRadius={BorderRadius.pill}
    backgroundColor={BackgroundColor.backgroundDefault}
    borderColor={BorderColor.borderMuted}
    style={{
      padding: 8,
      paddingRight: 11,
      minWidth: 'fit-content',
    }}
    size={SelectButtonSize.Lg}
    alignItems={AlignItems.center}
    descriptionProps={{
      overflowWrap: OverflowWrap.BreakWord,
      ellipsis: false,
    }}
    caretIconProps={{
      name: IconName.ArrowDown,
      style: { display: Display.None },
    }}
    label={asset.symbol}
    startAccessory={
      <BadgeWrapper
        key={asset.assetId}
        style={{ marginRight: 2 }}
        badge={
          <AvatarNetwork
            name={NETWORK_TO_SHORT_NETWORK_NAME_MAP[asset.chainId]}
            src={BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[asset.chainId]}
            size={AvatarNetworkSize.Xs}
            style={{ borderWidth: 1, borderRadius: 6 }}
            hasBorder
          />
        }
      >
        <AvatarToken src={asset.image} name={asset.symbol} />
      </BadgeWrapper>
    }
    {...props}
  />
);
