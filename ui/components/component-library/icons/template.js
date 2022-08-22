/**
 * Custom template for SVGR
 * Used for wrapping all the SVG files with our standardized BaseIcon component
 */

const template = ({ imports, componentName, jsx }, { tpl }) => {
  const exportedName = componentName.replace('Svg', '');
  const { children } = jsx;
  return tpl`${imports}
import PropTypes from 'prop-types';
import { SIZES } from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box/box';
import { BaseIcon } from '../../base-icon';

export const ${exportedName} = ({ size, color, className, ...props}) => {
  return React.createElement(BaseIcon, {
    size, color, className, ...props,
  }, ${children})
}

${exportedName}.propTypes = {
  /**
   * The size of the BaseIcon.
   * Possible values could be 'xxs', 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The color of the icon. Defaults to 'inherit'.
   */
  color: PropTypes.string,
  /**
   * An additional class name to apply to the icon.
   */
  className: PropTypes.string,
  /**
   * BaseIcon accepts all the props from Box
   */
  ...Box.propTypes,
};`;
};

module.exports = template;
