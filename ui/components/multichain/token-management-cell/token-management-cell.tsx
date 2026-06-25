import React from 'react';
import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import ToggleButton from '../../ui/toggle-button';
import { ASSET_CELL_HEIGHT } from '../../app/assets/constants';
import { AssetCellBadge } from '../../app/assets/asset-list/cells/asset-cell-badge';

export type TokenManagementCellProps = {
  /** Token symbol used as the avatar fallback text and aria-label. */
  symbol: string;
  /** Optional token icon URL. */
  image?: string;
  /** Token chain id used to render the home-page network badge. */
  chainId?: Hex | CaipChainId;
  /** Whether the asset is native to the chain. */
  isNative?: boolean;
  /** Token asset id used by the home-page badge image fallback logic. */
  assetId?: CaipAssetType | Hex;
  /** Primary label rendered as the row title (e.g. token name). */
  primaryLabel: string;
  /** Optional secondary label (e.g. balance / network). */
  secondaryLabel?: string;
  /** Whether the toggle is currently in the ON state. */
  isOn: boolean;
  /**
   * Called when the toggle is interacted with. Receives the next desired state.
   * The cell does not own state, so the parent is responsible for re-rendering
   * with the updated `isOn` after a successful action.
   */
  onToggle: (nextValue: boolean) => void;
  /** Disables the toggle interaction (e.g. while a request is in flight). */
  disabled?: boolean;
  /** Adds a loading state for smooth transition */
  isLoading?: boolean;
  /** Whether to show the toggle control. Native tokens cannot be hidden here. */
  showToggle?: boolean;
  /** Optional data-testid suffix (`token-management-cell-${testIdSuffix}`). */
  testIdSuffix?: string;
};

/**
 * A single row in the Token Management screen.
 *
 * Displays a token avatar, name, optional balance, and a toggle that controls
 * whether the token appears in the user's home asset list.
 *
 * Matches Figma node 1:8292 (Mobile Account Cell) from the
 * `Token-page-update` file.
 *
 * @param props - Component props.
 * @param props.symbol - Token symbol used as the avatar fallback text.
 * @param props.image - Optional token icon URL.
 * @param props.chainId - Token chain id used to render the home-page network badge.
 * @param props.isNative - Whether the asset is native to the chain.
 * @param props.assetId - Token asset id used by the home-page badge image fallback logic.
 * @param props.primaryLabel - Title rendered as the row's primary text.
 * @param props.secondaryLabel - Optional secondary text (e.g. balance).
 * @param props.isOn - Whether the toggle is currently in the ON state.
 * @param props.onToggle - Called with the next desired toggle value.
 * @param props.disabled - Disables the toggle interaction when true.
 * @param props.isLoading - Handles a loading state.
 * @param props.showToggle - Whether the toggle is rendered.
 * @param props.testIdSuffix - Optional suffix appended to the row test id.
 */
export const TokenManagementCell = ({
  symbol,
  image,
  chainId,
  isNative,
  assetId,
  primaryLabel,
  secondaryLabel,
  isOn,
  onToggle,
  disabled = false,
  isLoading = false,
  showToggle = true,
  testIdSuffix,
}: TokenManagementCellProps) => {
  const dataTestId = testIdSuffix
    ? `token-management-cell-${testIdSuffix}`
    : 'token-management-cell';
  const hasNetworkBadge = Boolean(chainId);

  const tokenAvatar = (
    <AvatarToken name={symbol} src={image} size={AvatarTokenSize.Md} />
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      gap={4}
      className="h-full w-full"
      data-testid={dataTestId}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        className="w-full"
        style={{ height: ASSET_CELL_HEIGHT }}
      >
        {hasNetworkBadge ? (
          <AssetCellBadge
            chainId={chainId as Hex | CaipChainId}
            isNative={isNative}
            tokenImage={image ?? ''}
            symbol={symbol}
            assetId={assetId}
            networkBadgeTestId={`${dataTestId}-network-badge`}
          />
        ) : (
          <Box marginRight={4} className="self-center">
            {tokenAvatar}
          </Box>
        )}
        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          className="min-w-0 flex-1"
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            ellipsis
          >
            {primaryLabel}
          </Text>
          {secondaryLabel ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              ellipsis
            >
              {secondaryLabel}
            </Text>
          ) : null}
        </Box>
        {showToggle ? (
          <span
            aria-busy={isLoading}
            className="relative inline-flex h-6 w-10 items-center justify-center"
          >
            <ToggleButton
              value={isOn}
              disabled={disabled || isLoading}
              onToggle={(currentValue: boolean) => {
                if (!disabled && !isLoading) {
                  onToggle(!currentValue);
                }
              }}
              offLabel=""
              onLabel=""
              dataTestId={`${dataTestId}-toggle`}
            />
          </span>
        ) : null}
      </Box>
    </Box>
  );
};
