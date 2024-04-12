import React from 'react';

import { IconColor } from '../../../helpers/constants/design-system';

import type {
  StyleUtilityProps,
  PolymorphicComponentPropWithRef,
} from '../box';

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
 */

export enum IconName {
  AddSquare = 'add-square',
  Add = 'add',
  Arrow2Down = 'arrow-2-down',
  Arrow2Left = 'arrow-2-left',
  Arrow2Right = 'arrow-2-right',
  Arrow2Up = 'arrow-2-up',
  Arrow2UpRight = 'arrow-2-up-right',
  ArrowDoubleLeft = 'arrow-double-left',
  ArrowDoubleRight = 'arrow-double-right',
  ArrowDown = 'arrow-down',
  ArrowLeft = 'arrow-left',
  ArrowRight = 'arrow-right',
  ArrowUp = 'arrow-up',
  BankToken = 'bank-token',
  Bank = 'bank',
  Book = 'book',
  Bookmark = 'bookmark',
  Bridge = 'bridge',
  Calculator = 'calculator',
  CardPos = 'card-pos',
  CardToken = 'card-token',
  Card = 'card',
  Category = 'category',
  Chart = 'chart',
  CheckBold = 'check-bold',
  Check = 'check',
  Clock = 'clock',
  Close = 'close',
  CodeCircle = 'code-circle',
  Coin = 'coin',
  Confirmation = 'confirmation',
  Connect = 'connect',
  CopySuccess = 'copy-success',
  Copy = 'copy',
  Danger = 'danger',
  Dark = 'dark',
  Data = 'data',
  Diagram = 'diagram',
  DocumentCode = 'document-code',
  DragDrop = 'drag-drop',
  DraggingAnimation = 'dragging-animation',
  PinningAnimation = 'pinning-animation',
  Edit = 'edit',
  Eraser = 'eraser',
  Ethereum = 'ethereum',
  Expand = 'expand',
  Explore = 'explore',
  Export = 'export',
  EyeSlash = 'eye-slash',
  Eye = 'eye',
  Filter = 'filter',
  Flag = 'flag',
  FlashSlash = 'flash-slash',
  Flash = 'flash',
  FullCircle = 'full-circle',
  Gas = 'gas',
  GlobalSearch = 'global-search',
  Global = 'global',
  Graph = 'graph',
  Hardware = 'hardware',
  Heart = 'heart',
  Hierarchy = 'hierarchy',
  Home = 'home',
  Import = 'import',
  Info = 'info',
  Key = 'key',
  Light = 'light',
  Link = 'link',
  Loading = 'loading',
  LockCircle = 'lock-circle',
  LockSlash = 'lock-slash',
  Lock = 'lock',
  Login = 'login',
  Logout = 'logout',
  Menu = 'menu',
  MessageQuestion = 'message-question',
  Messages = 'messages',
  MinusBold = 'minus-bold',
  MinusSquare = 'minus-square',
  Minus = 'minus',
  Mobile = 'mobile',
  Money = 'money',
  Monitor = 'monitor',
  MoreHorizontal = 'more-horizontal',
  MoreVertical = 'more-vertical',
  NotificationCircle = 'notification-circle',
  Notification = 'notification',
  PasswordCheck = 'password-check',
  People = 'people',
  Pin = 'pin',
  ProgrammingArrows = 'programming-arrows',
  Custody = 'custody',
  Question = 'question',
  Received = 'received',
  Refresh = 'refresh',
  Save = 'save',
  ScanBarcode = 'scan-barcode',
  ScanFocus = 'scan-focus',
  Scan = 'scan',
  Scroll = 'scroll',
  Search = 'search',
  SecurityCard = 'security-card',
  SecurityCross = 'security-cross',
  SecurityKey = 'security-key',
  SecuritySearch = 'security-search',
  SecuritySlash = 'security-slash',
  SecurityTick = 'security-tick',
  SecurityTime = 'security-time',
  SecurityUser = 'security-user',
  Security = 'security',
  Send1 = 'send-1',
  Send2 = 'send-2',
  Setting = 'setting',
  Slash = 'slash',
  SnapsMobile = 'snaps-mobile',
  SnapsPlus = 'snaps-plus',
  Snaps = 'snaps',
  Speedometer = 'speedometer',
  Star = 'star',
  Stake = 'stake',
  Student = 'student',
  SwapHorizontal = 'swap-horizontal',
  SwapVertical = 'swap-vertical',
  Tag = 'tag',
  Tilde = 'tilde',
  Timer = 'timer',
  Trash = 'trash',
  TrendDown = 'trend-down',
  TrendUp = 'trend-up',
  UserCircleAdd = 'user-circle-add',
  UserCircleLink = 'user-circle-link',
  UserCircleRemove = 'user-circle-remove',
  UserCircle = 'user-circle',
  User = 'user',
  WalletCard = 'wallet-card',
  WalletMoney = 'wallet-money',
  Wallet = 'wallet',
  Warning = 'warning',
  Twitter = 'twitter',
  QrCode = 'qr-code',
  UserCheck = 'user-check',
  Unpin = 'unpin',
  Ban = 'ban',
  Bold = 'bold',
  CircleX = 'circle-x',
  Download = 'download',
  FileIcon = 'file',
  Flask = 'flask',
  Plug = 'plug',
  Share = 'share',
  Square = 'square',
  Tint = 'tint',
  Upload = 'upload',
  Usb = 'usb',
  Wifi = 'wifi',
  PlusMinus = 'plus-minus',
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

export type IconProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, IconStyleUtilityProps>;

export type IconComponent = <C extends React.ElementType = 'span'>(
  props: IconProps<C>,
) => React.ReactElement | null;
