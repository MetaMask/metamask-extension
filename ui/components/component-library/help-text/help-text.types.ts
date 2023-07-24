import PropTypes from 'prop-types';
import type { TextStyleUtilityProps } from '../text';
import type { PolymorphicComponentPropWithRef } from '../box';
import { Severity, TextColor } from '../../../helpers/constants/design-system';

export enum HelpTextSeverity {
  Danger = Severity.Danger,
  Warning = Severity.Warning,
  Success = Severity.Success,
  Info = Severity.Info,
}

export interface HelpTextStyleUtilityProps extends TextStyleUtilityProps {
  severity?: HelpTextSeverity | Severity;
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

export type HelpTextProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, HelpTextStyleUtilityProps>;

export type HelpTextComponent = <C extends React.ElementType = 'span'>(
  props: HelpTextProps<C>,
) => React.ReactElement | null;
