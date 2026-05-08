import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  Text,
} from '../../component-library';
import ToggleButton from '../../ui/toggle-button';
import { ASSET_CELL_HEIGHT } from '../../app/assets/constants';

export type TokenManagementCellProps = {
  /** Token symbol used as the avatar fallback text and aria-label. */
  symbol: string;
  /** Optional token icon URL. */
  image?: string;
  /** Optional network icon URL rendered as a badge on the token avatar. */
  networkImage?: string;
  /** Optional network name used by the badge for fallback text and accessibility. */
  networkName?: string;
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
 * @param props.networkImage - Optional network icon URL.
 * @param props.networkName - Optional network name.
 * @param props.primaryLabel - Title rendered as the row's primary text.
 * @param props.secondaryLabel - Optional secondary text (e.g. balance).
 * @param props.isOn - Whether the toggle is currently in the ON state.
 * @param props.onToggle - Called with the next desired toggle value.
 * @param props.disabled - Disables the toggle interaction when true.
 * @param props.showToggle - Whether the toggle is rendered.
 * @param props.testIdSuffix - Optional suffix appended to the row test id.
 */
export const TokenManagementCell = ({
  symbol,
  image,
  networkImage,
  networkName,
  primaryLabel,
  secondaryLabel,
  isOn,
  onToggle,
  disabled = false,
  showToggle = true,
  testIdSuffix,
}: TokenManagementCellProps) => {
  const dataTestId = testIdSuffix
    ? `token-management-cell-${testIdSuffix}`
    : 'token-management-cell';
  const hasNetworkBadge = Boolean(networkImage || networkName);

  const tokenAvatar = (
    <AvatarToken
      name={symbol}
      src={image}
      backgroundColor={BackgroundColor.backgroundSection}
    />
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      width={BlockSize.Full}
      height={BlockSize.Full}
      gap={4}
      data-testid={dataTestId}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        backgroundColor={BackgroundColor.backgroundDefault}
        width={BlockSize.Full}
        style={{ height: ASSET_CELL_HEIGHT }}
      >
        {hasNetworkBadge ? (
          <BadgeWrapper
            badge={
              <AvatarNetwork
                name={networkName ?? symbol}
                src={networkImage}
                size={AvatarNetworkSize.Xs}
                backgroundColor={BackgroundColor.backgroundSection}
                borderWidth={2}
              />
            }
            marginRight={4}
            style={{ alignSelf: 'center' }}
            badgeContainerProps={{
              'data-testid': `${dataTestId}-network-badge`,
            }}
          >
            {tokenAvatar}
          </BadgeWrapper>
        ) : (
          <Box marginRight={4} style={{ alignSelf: 'center' }}>
            {tokenAvatar}
          </Box>
        )}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          style={{ flex: '1 1 0', minWidth: 0 }}
        >
          <Text
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.textDefault}
            ellipsis
          >
            {primaryLabel}
          </Text>
          {secondaryLabel ? (
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              ellipsis
            >
              {secondaryLabel}
            </Text>
          ) : null}
        </Box>
        {showToggle ? (
          <ToggleButton
            value={isOn}
            disabled={disabled}
            onToggle={(currentValue: boolean) => onToggle(!currentValue)}
            offLabel=""
            onLabel=""
            dataTestId={`${dataTestId}-toggle`}
          />
        ) : null}
      </Box>
    </Box>
  );
};
