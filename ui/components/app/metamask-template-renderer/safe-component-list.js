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
import { AvatarIcon, Text } from '../../component-library';
import ActionableMessage from '../../ui/actionable-message/actionable-message';
import { AccountListItem } from '../../multichain';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { ConfirmInfoRow, ConfirmInfoRowAddress } from '../confirm/info/row';
import { SnapDelineator } from '../snaps/snap-delineator';
import { Copyable } from '../snaps/copyable';
import Spinner from '../../ui/spinner';
import { SnapUIMarkdown } from '../snaps/snap-ui-markdown';
import { SnapUIImage } from '../snaps/snap-ui-image';
import { SnapUIInput } from '../snaps/snap-ui-input';
import { SnapUIForm } from '../snaps/snap-ui-form';
import { SnapUIButton } from '../snaps/snap-ui-button';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SnapAccountSuccessMessage } from '../../../pages/confirmations/components/snap-account-success-message';
import { SnapAccountErrorMessage } from '../../../pages/confirmations/components/snap-account-error-message';
import { CreateSnapAccount } from '../../../pages/create-snap-account';
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
  UrlIcon,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  Copyable,
  SnapDelineator,
  SnapUIMarkdown,
  SnapUIImage,
  Spinner,
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  SnapUIInput,
  SnapUIButton,
  SnapUIForm,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  CreateSnapAccount,
  RemoveSnapAccount,
  SnapAccountSuccessMessage,
  SnapAccountErrorMessage,
  SnapAuthorshipHeader,
  SnapAccountRedirect,
  SnapAccountCard,
  ///: END:ONLY_INCLUDE_IF
};
