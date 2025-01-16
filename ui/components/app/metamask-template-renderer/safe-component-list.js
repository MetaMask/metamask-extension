import ConfirmationNetworkSwitch from '../../../pages/confirmations/confirmation/components/confirmation-network-switch';
import { SmartTransactionStatusPage } from '../../../pages/smart-transactions/smart-transaction-status-page';
import {
  AvatarIcon,
  BannerAlert,
  FormTextField,
  Text,
} from '../../component-library';
import { AccountListItem } from '../../multichain';
import ActionableMessage from '../../ui/actionable-message/actionable-message';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Chip from '../../ui/chip';
import DefinitionList from '../../ui/definition-list';
import Preloader from '../../ui/icon/preloader';
import OriginPill from '../../ui/origin-pill/origin-pill';
import Popover from '../../ui/popover';
import Spinner from '../../ui/spinner';
import TextField from '../../ui/text-field';
import TextArea from '../../ui/textarea/textarea';
import Tooltip from '../../ui/tooltip/tooltip';
import TruncatedDefinitionList from '../../ui/truncated-definition-list';
import Typography from '../../ui/typography';
import UrlIcon from '../../ui/url-icon';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowValueDouble,
} from '../confirm/info/row';
import MetaMaskTranslation from '../metamask-translation';
import NetworkDisplay from '../network-display';
import { Copyable } from '../snaps/copyable';
import { SnapDelineator } from '../snaps/snap-delineator';
import { SnapUIAddress } from '../snaps/snap-ui-address';
import { SnapUIAvatar } from '../snaps/snap-ui-avatar';
import { SnapUIBanner } from '../snaps/snap-ui-banner';
import { SnapUISkeleton } from '../snaps/snaps-ui-skeleton';
import { SnapUIButton } from '../snaps/snap-ui-button';
import { SnapUICard } from '../snaps/snap-ui-card';
import { SnapUICheckbox } from '../snaps/snap-ui-checkbox';
import { SnapUIDropdown } from '../snaps/snap-ui-dropdown';
import { SnapUIFileInput } from '../snaps/snap-ui-file-input';
import { SnapUIFooterButton } from '../snaps/snap-ui-footer-button';
import { SnapUIForm } from '../snaps/snap-ui-form';
import { SnapUIIcon } from '../snaps/snap-ui-icon';
import { SnapUIImage } from '../snaps/snap-ui-image';
import { SnapUIInput } from '../snaps/snap-ui-input';
import { SnapUILink } from '../snaps/snap-ui-link';
import { SnapUIMarkdown } from '../snaps/snap-ui-markdown';
import { SnapUIRadioGroup } from '../snaps/snap-ui-radio-group';
import { SnapUISelector } from '../snaps/snap-ui-selector';
import { SnapUITooltip } from '../snaps/snap-ui-tooltip';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SnapAccountErrorMessage } from '../../../pages/confirmations/components/snap-account-error-message';
import { SnapAccountSuccessMessage } from '../../../pages/confirmations/components/snap-account-success-message';
import { CreateSnapAccount } from '../../../pages/create-snap-account';
import {
  RemoveSnapAccount,
  SnapAccountCard,
} from '../../../pages/remove-snap-account';
import { SnapAccountRedirect } from '../../../pages/snap-account-redirect';
import { CreateNamedSnapAccount } from '../../multichain/create-named-snap-account';
import SnapAuthorshipHeader from '../snaps/snap-authorship-header';
///: END:ONLY_INCLUDE_IF

export const safeComponentList = {
  a: 'a',
  AccountListItem,
  ActionableMessage,
  AvatarIcon,
  b: 'b',
  BannerAlert,
  Box,
  Button,
  Chip,
  ConfirmationNetworkSwitch,
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowValueDouble,
  Copyable,
  DefinitionList,
  div: 'div',
  FormTextField,
  i: 'i',
  MetaMaskTranslation,
  NetworkDisplay,
  OriginPill,
  p: 'p',
  Popover,
  Preloader,
  SnapDelineator,
  SnapUIAddress,
  SnapUIAvatar,
  SnapUIBanner,
  SnapUISkeleton,
  SnapUIButton,
  SnapUICard,
  SnapUICheckbox,
  SnapUIDropdown,
  SnapUIFileInput,
  SnapUIForm,
  SnapUIFooterButton,
  SnapUIIcon,
  SnapUIImage,
  SnapUIInput,
  SnapUILink,
  SnapUIMarkdown,
  SnapUIRadioGroup,
  SnapUISelector,
  SnapUITooltip,
  span: 'span',
  Spinner,
  Text,
  TextArea,
  TextField,
  Tooltip,
  TruncatedDefinitionList,
  Typography,
  SmartTransactionStatusPage,
  UrlIcon,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  CreateNamedSnapAccount,
  CreateSnapAccount,
  RemoveSnapAccount,
  SnapAccountCard,
  SnapAccountErrorMessage,
  SnapAccountRedirect,
  SnapAccountSuccessMessage,
  SnapAuthorshipHeader,
  ///: END:ONLY_INCLUDE_IF
};
