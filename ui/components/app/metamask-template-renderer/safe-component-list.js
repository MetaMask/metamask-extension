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
import ConfirmationNetworkSwitch from '../../../pages/confirmation/components/confirmation-network-switch';
import UrlIcon from '../../ui/url-icon';
import Tooltip from '../../ui/tooltip/tooltip';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import { SnapDelineator } from '../snaps/snap-delineator';
import { Copyable } from '../snaps/copyable';
import Spinner from '../../ui/spinner';
import { SnapUIMarkdown } from '../snaps/snap-ui-markdown';
import { FormTextField } from '../../component-library/form-text-field';
import { Button as DSButton } from '../../component-library/button';
///: END:ONLY_INCLUDE_IN

export const safeComponentList = {
  a: 'a',
  b: 'b',
  i: 'i',
  p: 'p',
  div: 'div',
  span: 'span',
  Box,
  Button,
  Chip,
  ConfirmationNetworkSwitch,
  DefinitionList,
  MetaMaskTranslation,
  NetworkDisplay,
  Popover,
  TextArea,
  TextField,
  Tooltip,
  TruncatedDefinitionList,
  Typography,
  UrlIcon,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  hr: 'hr',
  form: 'form',
  SnapDelineator,
  Copyable,
  Spinner,
  SnapUIMarkdown,
  FormTextField,
  DSButton,
  ///: END:ONLY_INCLUDE_IN
};
