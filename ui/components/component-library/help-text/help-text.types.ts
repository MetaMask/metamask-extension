import PropTypes from 'prop-types';
import { TextProps } from '../text';
import { Severity, TextColor } from '../../../helpers/constants/design-system';

export enum HelpTextSeverity {
  Danger = Severity.Danger,
  Warning = Severity.Warning,
  Success = Severity.Success,
  Info = Severity.Info,
}

export interface HelpTextProps extends TextProps {
  severity?: HelpTextSeverity;
  /**
   * The color of the HelpText will be overridden if there is a severity passed
   * Defaults to Color.textDefault
   */
  color?: TextColor;
  /**
   * The content of the help-text
   */
  children: string | PropTypes.ReactNodeLike;
  /**
   * Additional classNames to be added to the HelpText component
   */
  className?: string;
}
