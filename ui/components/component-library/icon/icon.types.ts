/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react';

import { IconColor } from '../../../helpers/constants/design-system';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

/**
 * @deprecated This type has been deprecated in favor of the one from @metamask/design-system-react
 */
export enum IconSize {
  Xs = 'xs',
  Sm = 'sm',
  Md = 'md',
  Lg = 'lg',
  Xl = 'xl',
  Inherit = 'inherit',
}

/**
 * The IconName enum contains all the possible icon names.
 *
 * Search for an icon: https://metamask.github.io/metamask-storybook/?path=/story/components-componentlibrary-icon--default-story
 *
 * Add an icon: https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-icon--default-story#adding-a-new-icon
 *
 * @deprecated This type has been deprecated in favor of the one from @metamask/design-system-react
 */

export enum IconName {
  Accessibility = 'accessibility',
  AddSquare = 'add-square',
  Add = 'add',
  Arrow2Down = 'arrow-2-down',
  Arrow2Right = 'arrow-2-right',
  Arrow2UpRight = 'arrow-2-up-right',
  Arrow2Up = 'arrow-2-up',
  ArrowDown = 'arrow-down',
  ArrowLeft = 'arrow-left',
  ArrowRight = 'arrow-right',
  ArrowUp = 'arrow-up',
  Ban = 'ban',
  Bank = 'bank',
  Book = 'book',
  Bookmark = 'bookmark',
  Bridge = 'bridge',
  Calculator = 'calculator',
  Card = 'card',
  CheckBold = 'check-bold',
  Check = 'check',
  CircleX = 'circle-x',
  Clock = 'clock',
  Close = 'close',
  Coin = 'coin',
  Collapse = 'collapse',
  Confirmation = 'confirmation',
  Connect = 'connect',
  CopySuccess = 'copy-success',
  Copy = 'copy',
  Customize = 'customize',
  Danger = 'danger',
  DocumentCode = 'document-code',
  Dollar = 'dollar',
  Download = 'download',
  Edit = 'edit',
  Ethereum = 'ethereum',
  Expand = 'expand',
  Explore = 'explore',
  Export = 'export',
  EyeSlash = 'eye-slash',
  Eye = 'eye',
  Filter = 'filter',
  Flash = 'flash',
  FullCircle = 'full-circle',
  Gas = 'gas',
  GlobalSearch = 'global-search',
  Global = 'global',
  Hierarchy = 'hierarchy',
  Home = 'home',
  Info = 'info',
  Key = 'key',
  Link = 'link',
  Loading = 'loading',
  Lock = 'lock',
  Logout = 'logout',
  Menu = 'menu',
  Messages = 'messages',
  MinusBold = 'minus-bold',
  MoreVertical = 'more-vertical',
  Notification = 'notification',
  ProgrammingArrows = 'programming-arrows',
  Question = 'question',
  Received = 'received',
  Refresh = 'refresh',
  Save = 'save',
  ScanBarcode = 'scan-barcode',
  Scan = 'scan',
  Search = 'search',
  SecurityKey = 'security-key',
  SecuritySearch = 'security-search',
  SecurityTick = 'security-tick',
  Security = 'security',
  Send = 'send',
  Setting = 'setting',
  Snaps = 'snaps',
  Speedometer = 'speedometer',
  Stake = 'stake',
  SwapHorizontal = 'swap-horizontal',
  SwapVertical = 'swap-vertical',
  Trash = 'trash',
  Upload = 'upload',
  Usb = 'usb',
  UserCircleAdd = 'user-circle-add',
  UserCircleRemove = 'user-circle-remove',
  VerifiedFilled = 'verified-filled',
  Wallet = 'wallet',
  Warning = 'warning',
  Wifi = 'wifi',
}

// TODO: Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface IconStyleUtilityProps extends StyleUtilityProps {
  /**
   * The name of the icon to display. Use the IconName enum
   * Search for an icon: https://metamask.github.io/metamask-storybook/?path=/story/components-componentlibrary-icon--default-story
   */
  name: IconName;
  /**
   * The size of the Icon.
   * Possible values could be IconSize.Xs (12px), IconSize.Sm (16px), IconSize.Md (20px), IconSize.Lg (24px), IconSize.Xl (32px), IconSize.Inherit (inherits font-size).
   * Default value is IconSize.Md (20px).
   */
  size?: IconSize;
  /**
   * The color of the icon.
   * Defaults to IconColor.inherit.
   */
  color?: IconColor;
  /**
   * An additional className to apply to the icon.
   */
  className?: string;
  /**
   * Addition style properties to apply to the icon.
   * The Icon component uses inline styles to apply the icon's mask-image so be wary of overriding
   */
  style?: React.CSSProperties;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type IconProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, IconStyleUtilityProps>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type IconComponent = <C extends React.ElementType = 'span'>(
  props: IconProps<C>,
) => React.ReactElement | null;
