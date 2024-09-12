import Button from '../../ui/button';
import Chip from '../../ui/chip';
import DefinitionList from '../../ui/definition-list';
import TruncatedDefinitionList from '../../ui/truncated-definition-list';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography';
import Box from '../../ui/box';
import MetaMaskTranslation from '../metamask-translation';
import NetworkDisplay from '../network-display';
import TextArea from '../../ui/textarea/textarea';
import TextField from '../../ui/text-field';
import ConfirmationNetworkSwitch from '../../../pages/confirmations/confirmation/components/confirmation-network-switch';
import UrlIcon from '../../ui/url-icon';
import Tooltip from '../../ui/tooltip/tooltip';
import {
  AvatarIcon,
  FormTextField,
  Text,
  BannerAlert,
} from '../../component-library';
import ActionableMessage from '../../ui/actionable-message/actionable-message';
import { AccountListItem } from '../../multichain';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowValueDouble,
} from '../confirm/info/row';
import { SnapDelineator } from '../snaps/snap-delineator';
import { Copyable } from '../snaps/copyable';
import Spinner from '../../ui/spinner';
import { SnapUIMarkdown } from '../snaps/snap-ui-markdown';
import { SnapUILink } from '../snaps/snap-ui-link';
import { SmartTransactionStatusPage } from '../../../pages/smart-transactions/smart-transaction-status-page';
import { SnapUIIcon } from '../snaps/snap-ui-icon';
import { SnapUIImage } from '../snaps/snap-ui-image';
import { SnapUIFileInput } from '../snaps/snap-ui-file-input';
import { SnapUIInput } from '../snaps/snap-ui-input';
import { SnapUIForm } from '../snaps/snap-ui-form';
import { SnapUIButton } from '../snaps/snap-ui-button';
import { SnapUIDropdown } from '../snaps/snap-ui-dropdown';
import { SnapUIRadioGroup } from '../snaps/snap-ui-radio-group';
import { SnapUICheckbox } from '../snaps/snap-ui-checkbox';
import { SnapUITooltip } from '../snaps/snap-ui-tooltip';
import { SnapUICard } from '../snaps/snap-ui-card';
import { SnapUISelector } from '../snaps/snap-ui-selector';
import { SnapFooterButton } from '../snaps/snap-footer-button';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SnapAccountSuccessMessage } from '../../../pages/confirmations/components/snap-account-success-message';
import { SnapAccountErrorMessage } from '../../../pages/confirmations/components/snap-account-error-message';
import { CreateSnapAccount } from '../../../pages/create-snap-account';
import { CreateNamedSnapAccount } from '../../multichain/create-named-snap-account';
import {
  RemoveSnapAccount,
  SnapAccountCard,
} from '../../../pages/remove-snap-account';
import { SnapAccountRedirect } from '../../../pages/snap-account-redirect';
import SnapAuthorshipHeader from '../snaps/snap-authorship-header';
///: END:ONLY_INCLUDE_IF

export const safeComponentList = {
  a: 'a',
  ActionableMessage,
  AccountListItem,
  AvatarIcon,
  b: 'b',
  Box,
  Button,
  Chip,
  ConfirmationNetworkSwitch,
  DefinitionList,
  div: 'div',
  i: 'i',
  MetaMaskTranslation,
  NetworkDisplay,
  p: 'p',
  Popover,
  span: 'span',
  Text,
  TextArea,
  TextField,
  Tooltip,
  TruncatedDefinitionList,
  Typography,
  SmartTransactionStatusPage,
  UrlIcon,
  Copyable,
  SnapDelineator,
  SnapUIMarkdown,
  SnapUILink,
  SnapUIIcon,
  SnapUIImage,
  BannerAlert,
  Spinner,
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowValueDouble,
  SnapUIFileInput,
  SnapUIInput,
  SnapUIButton,
  SnapUIForm,
  SnapUIDropdown,
  SnapUIRadioGroup,
  SnapUICheckbox,
  SnapUITooltip,
  SnapUICard,
  SnapUISelector,
  SnapFooterButton,
  FormTextField,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  CreateSnapAccount,
  RemoveSnapAccount,
  CreateNamedSnapAccount,
  SnapAccountSuccessMessage,
  SnapAccountErrorMessage,
  SnapAuthorshipHeader,
  SnapAccountRedirect,
  SnapAccountCard,
  ///: END:ONLY_INCLUDE_IF
};
