import ConfirmationNetworkSwitch from '../../../pages/confirmations/confirmation/components/confirmation-network-switch/confirmation-network-switch';
import { AvatarIcon } from '../../component-library/avatar-icon/avatar-icon';
import { BannerAlert } from '../../component-library/banner-alert/banner-alert';
import { FormTextField } from '../../component-library/form-text-field/form-text-field';
import { Text } from '../../component-library/text/text';
import AccountListItem from '../../multichain/account-list-item/account-list-item';
import ActionableMessage from '../../ui/actionable-message/actionable-message';
import Box from '../../ui/box/box';
import Button from '../../ui/button/button.component';
import Chip from '../../ui/chip/chip';
import DefinitionList from '../../ui/definition-list/definition-list';
import Preloader from '../../ui/icon/preloader/preloader-icon.component';
import OriginPill from '../../ui/origin-pill/origin-pill';
import Popover from '../../ui/popover/popover.component';
import Spinner from '../../ui/spinner/spinner.component';
import TextField from '../../ui/text-field/text-field.component';
import TextArea from '../../ui/textarea/textarea';
import Tooltip from '../../ui/tooltip/tooltip';
import TruncatedDefinitionList from '../../ui/truncated-definition-list/truncated-definition-list';
import Typography from '../../ui/typography/typography';
import UrlIcon from '../../ui/url-icon/url-icon';
import { ConfirmInfoRow } from '../confirm/info/row/row';
import { ConfirmInfoRowAddress } from '../confirm/info/row/address';
import { ConfirmInfoRowValueDouble } from '../confirm/info/row/value-double';
import { Copyable } from '../snaps/copyable/copyable';
import { SnapDelineator } from '../snaps/snap-delineator/snap-delineator';
import { SnapUIAddress } from '../snaps/snap-ui-address/snap-ui-address';
import { SnapUIAvatar } from '../snaps/snap-ui-avatar/snap-ui-avatar';
import { SnapUIBanner } from '../snaps/snap-ui-banner/snap-ui-banner';
import { SnapUIButton } from '../snaps/snap-ui-button/snap-ui-button';
import { SnapUICard } from '../snaps/snap-ui-card/snap-ui-card';
import { SnapUICheckbox } from '../snaps/snap-ui-checkbox/snap-ui-checkbox';
import { SnapUIDropdown } from '../snaps/snap-ui-dropdown/snap-ui-dropdown';
import { SnapUIFileInput } from '../snaps/snap-ui-file-input/snap-ui-file-input';
import { SnapUIFooterButton } from '../snaps/snap-ui-footer-button/snap-ui-footer-button';
import { SnapUIForm } from '../snaps/snap-ui-form/snap-ui-form';
import { SnapUIIcon } from '../snaps/snap-ui-icon/snap-ui-icon';
import { SnapUIImage } from '../snaps/snap-ui-image/snap-ui-image';
import { SnapUIInput } from '../snaps/snap-ui-input/snap-ui-input';
import { SnapUILink } from '../snaps/snap-ui-link/snap-ui-link';
import { SnapUIAddressInput } from '../snaps/snap-ui-address-input/snap-ui-address-input';
import { SnapUIMarkdown } from '../snaps/snap-ui-markdown/snap-ui-markdown';
import { SnapUIRadioGroup } from '../snaps/snap-ui-radio-group/snap-ui-radio-group';
import { SnapUISelector } from '../snaps/snap-ui-selector/snap-ui-selector';
import { SnapUITooltip } from '../snaps/snap-ui-tooltip/snap-ui-tooltip';
import { SnapUIAssetSelector } from '../snaps/snap-ui-asset-selector/snap-ui-asset-selector';
import { SnapUIAccountSelector } from '../snaps/snap-ui-account-selector/snap-ui-account-selector';
import { mmLazy } from '../../../helpers/utils/mm-lazy';
import SnapAccountErrorMessage from '../../../pages/confirmations/components/snap-account-error-message/SnapAccountErrorMessage';
import SnapAccountSuccessMessage from '../../../pages/confirmations/components/snap-account-success-message/SnapAccountSuccessMessage';
import CreateSnapAccount from '../../../pages/create-snap-account/create-snap-account';
import RemoveSnapAccount from '../../../pages/remove-snap-account/remove-snap-account';
import { SnapAccountCard } from '../../../pages/remove-snap-account/snap-account-card';
import SnapAccountRedirect from '../../../pages/snap-account-redirect/snap-account-redirect';
import SnapAuthorshipHeader from '../snaps/snap-authorship-header/snap-authorship-header';
import MetaMaskTranslation from '../metamask-translation/metamask-translation';
import { Skeleton } from '../../component-library/skeleton/skeleton';
import { DefiReferralConsent } from '../../../pages/core/defi-referral-consent/defi-referral-consent';
import { HyperliquidDepositPrompt } from '../hyperliquid-deposit-prompt/hyperliquid-deposit-prompt';
import { Delineator } from '../../ui/delineator/delineator';

// The owning screen suspends until all interface fields and actions are ready.
const SnapUIDateTimePicker = mmLazy(
  () => import('../snaps/snap-ui-date-time-picker/snap-ui-date-time-picker'),
);

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
  DefiReferralConsent,
  DefinitionList,
  div: 'div',
  FormTextField,
  HyperliquidDepositPrompt,
  i: 'i',
  OriginPill,
  p: 'p',
  Popover,
  Preloader,
  SnapDelineator,
  SnapUIAccountSelector,
  SnapUIAddress,
  SnapUIAvatar,
  SnapUIBanner,
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
  SnapUIAddressInput,
  SnapUILink,
  SnapUIMarkdown,
  SnapUIRadioGroup,
  SnapUISelector,
  SnapUITooltip,
  SnapUIAssetSelector,
  SnapUIDateTimePicker,
  span: 'span',
  Spinner,
  Skeleton,
  Text,
  TextArea,
  TextField,
  Tooltip,
  TruncatedDefinitionList,
  Typography,
  UrlIcon,
  CreateSnapAccount,
  RemoveSnapAccount,
  SnapAccountCard,
  SnapAccountErrorMessage,
  SnapAccountRedirect,
  SnapAccountSuccessMessage,
  SnapAuthorshipHeader,
  MetaMaskTranslation,
  Delineator,
};
