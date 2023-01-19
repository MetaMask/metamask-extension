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
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { SnapDelineator } from '../flask/snap-delineator';
import { Copyable } from '../flask/copyable';
import Spinner from '../../ui/spinner';
import { SnapUIMarkdown } from '../flask/snap-ui-markdown';
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
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  SnapDelineator,
  Copyable,
  Spinner,
  hr: 'hr',
  SnapUIMarkdown,
  ///: END:ONLY_INCLUDE_IN
};
