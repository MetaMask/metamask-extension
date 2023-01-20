import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Typography from '../typography/typography';
import Box from '../box/box';
import {
  COLORS,
  TEXT_ALIGN,
  DISPLAY,
  TYPOGRAPHY,
  FONT_WEIGHT,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';

import NumericInput from '../numeric-input/numeric-input.component';
import InfoTooltip from '../info-tooltip/info-tooltip';

export default function FormField({
  dataTestId,
  titleText = '',
  TitleTextCustomComponent,
  titleUnit = '',
  TitleUnitCustomComponent,
  tooltipText = '',
  TooltipCustomComponent,
  titleDetail = '',
  titleDetailWrapperProps,
  error,
  onChange = undefined,
  value = 0,
  numeric,
  detailText = '',
  autoFocus = false,
  password = false,
  allowDecimals = false,
  disabled = false,
  placeholder,
  warning,
  passwordStrength,
  passwordStrengthText,
  id,
  inputProps,
  wrappingLabelProps,
}) {
  return (
    <div
      className={classNames('form-field', {
        'form-field__row--error': error,
      })}
    >
      <Box as="label" {...wrappingLabelProps}>
        <div className="form-field__heading">
          <Box
            className="form-field__heading-title"
            display={DISPLAY.FLEX}
            alignItems={ALIGN_ITEMS.BASELINE}
          >
            {TitleTextCustomComponent ||
              (titleText && (
                <Typography
                  tag="label"
                  htmlFor={id}
                  html
                  fontWeight={FONT_WEIGHT.BOLD}
                  variant={TYPOGRAPHY.H6}
                  boxProps={{ display: DISPLAY.INLINE_BLOCK }}
                >
                  {titleText}
                </Typography>
              ))}
            {TitleUnitCustomComponent ||
              (titleUnit && (
                <Typography
                  tag={TYPOGRAPHY.H6}
                  variant={TYPOGRAPHY.H6}
                  color={COLORS.TEXT_ALTERNATIVE}
                  boxProps={{ display: DISPLAY.INLINE_BLOCK }}
                >
                  {titleUnit}
                </Typography>
              ))}
            {TooltipCustomComponent ||
              (tooltipText && (
                <InfoTooltip position="top" contentText={tooltipText} />
              ))}
          </Box>
          {titleDetail && (
            <Box
              className="form-field__heading-detail"
              textAlign={TEXT_ALIGN.END}
              marginRight={2}
              {...titleDetailWrapperProps}
            >
              {titleDetail}
            </Box>
          )}
        </div>
        {numeric ? (
          <NumericInput
            error={error}
            onChange={onChange}
            value={value}
            detailText={detailText}
            autoFocus={autoFocus}
            allowDecimals={allowDecimals}
            disabled={disabled}
            dataTestId={dataTestId}
            placeholder={placeholder}
            id={id}
          />
        ) : (
          <input
            className={classNames('form-field__input', {
              'form-field__input--error': error,
              'form-field__input--warning': warning,
            })}
            onChange={(e) => onChange(e.target.value)}
            value={value}
            type={password ? 'password' : 'text'}
            autoFocus={autoFocus}
            disabled={disabled}
            data-testid={dataTestId}
            placeholder={placeholder}
            id={id}
            {...inputProps}
          />
        )}
        {error && (
          <Typography
            color={COLORS.ERROR_DEFAULT}
            variant={TYPOGRAPHY.H7}
            className="form-field__error"
          >
            {error}
          </Typography>
        )}
        {warning && (
          <Typography
            color={COLORS.TEXT_ALTERNATIVE}
            variant={TYPOGRAPHY.H7}
            className="form-field__warning"
          >
            {warning}
          </Typography>
        )}
        {passwordStrength && (
          <Typography
            color={COLORS.TEXT_DEFAULT}
            variant={TYPOGRAPHY.H7}
            className="form-field__password-strength"
          >
            {passwordStrength}
          </Typography>
        )}
        {passwordStrengthText && (
          <Typography
            color={COLORS.TEXT_ALTERNATIVE}
            variant={TYPOGRAPHY.H8}
            className="form-field__password-strength-text"
          >
            {passwordStrengthText}
          </Typography>
        )}
      </Box>
    </div>
  );
}

FormField.propTypes = {
  /**
   * Identifier for testing purpose
   */
  dataTestId: PropTypes.string,
  /**
   * Form Fields Title
   */
  titleText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * A custom component to replace the title text Typography component
   * titleText will be ignored if this is provided
   */
  TitleTextCustomComponent: PropTypes.node,
  /**
   * Show unit (eg. ETH)
   */
  titleUnit: PropTypes.string,
  /**
   * A custom component to replace the title unit Typography component
   * titleUnit will be ignored if this is provided
   */
  TitleUnitCustomComponent: PropTypes.node,
  /**
   * Add Tooltip and text content
   */
  tooltipText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * A custom component to replace the tooltip component
   * tooltipText will be ignored if this is provided
   */
  TooltipCustomComponent: PropTypes.node,
  /**
   * Show content (text, image, component) in title
   */
  titleDetail: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Props to pass to wrapping Box component of the titleDetail component
   * Accepts all props of the Box component
   */
  titleDetailWrapperProps: PropTypes.shape({
    ...Box.propTypes,
  }),
  /**
   * Show error message
   */
  error: PropTypes.string,
  /**
   * Show warning message
   */
  warning: PropTypes.string,
  /**
   * Handler when fields change
   */
  onChange: PropTypes.func,
  /**
   * Field value
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Show detail text if field mode is numeric
   */
  detailText: PropTypes.string,
  /**
   * Set autofocus on render
   */
  autoFocus: PropTypes.bool,
  /**
   * Set numeric mode, the default is text
   */
  numeric: PropTypes.bool,
  /**
   * Set password mode
   */
  password: PropTypes.bool,
  /**
   * Allow decimals on the field
   */
  allowDecimals: PropTypes.bool,
  /**
   * Check if the form disabled
   */
  disabled: PropTypes.bool,
  /**
   * Set the placeholder text for the input field
   */
  placeholder: PropTypes.string,
  /**
   * Show password strength according to the score
   */
  passwordStrength: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * Show password strength description
   */
  passwordStrengthText: PropTypes.string,
  /**
   * The id of the input element. Should be used when the wrapping label is changed to a div to ensure accessibility.
   */
  id: PropTypes.string,
  /**
   * Any additional input attributes or overrides not provided by exposed props
   */
  inputProps: PropTypes.object,
  /**
   * The FormField is wrapped in a Box component that is rendered as a <label/> using the polymorphic "as" prop.
   * This object allows you to override the rendering of the label by using the wrapperProps={{ as: 'div' }} prop.
   * If used ensure the id prop is set on the input and a label element is present using htmlFor with the same id to ensure accessibility.
   */
  wrappingLabelProps: PropTypes.object,
};
