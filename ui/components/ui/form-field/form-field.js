import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {
  TextAlign,
  Display,
  TextVariant,
  AlignItems,
  TextColor,
} from '../../../helpers/constants/design-system';

import NumericInput from '../numeric-input/numeric-input.component';
import InfoTooltip from '../info-tooltip/info-tooltip';
import { Text, Box } from '../../component-library';

/**
 * @deprecated The `<FormField />` component has been deprecated in favor of the new `<FormTextField>` component from the component-library.
 * Please update your code to use the new `<FormTextField>` component instead, which can be found at ui/components/component-library/form-text-field/form-text-field.js.
 * You can find documentation for the new FormTextField component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-formtextfield--docs}
 * If you would like to help with the replacement of the old FormField component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/19737}
 */

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
  titleHeadingWrapperProps,
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
  warningProps,
  passwordStrength,
  passwordStrengthText,
  id,
  inputProps,
  wrappingLabelProps,
  inputRef,
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
            display={Display.Flex}
            alignItems={AlignItems.baseline}
            {...titleHeadingWrapperProps}
          >
            {TitleTextCustomComponent ||
              (titleText && (
                <Text
                  as="h6"
                  variant={TextVariant.bodySmBold}
                  display={Display.InlineBlock}
                >
                  {titleText}
                </Text>
              ))}
            {TitleUnitCustomComponent ||
              (titleUnit && (
                <Text
                  as="h6"
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                  display={Display.InlineBlock}
                >
                  {titleUnit}
                </Text>
              ))}
            {TooltipCustomComponent ||
              (tooltipText && (
                <InfoTooltip position="top" contentText={tooltipText} />
              ))}
          </Box>
          {titleDetail && (
            <Box
              className="form-field__heading-detail"
              textAlign={TextAlign.End}
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
            inputRef={inputRef}
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
            ref={inputRef}
            {...inputProps}
          />
        )}
        {error && (
          <Text
            color={TextColor.errorDefault}
            variant={TextVariant.bodySm}
            as="h6"
            className="form-field__error"
          >
            {error}
          </Text>
        )}
        {warning && (
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            as="h6"
            className="form-field__warning"
            {...warningProps}
          >
            {warning}
          </Text>
        )}
        {passwordStrength && (
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodySm}
            as="h6"
            className="form-field__password-strength"
          >
            {passwordStrength}
          </Text>
        )}
        {passwordStrengthText && (
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyXs}
            as="h6"
            className="form-field__password-strength-text"
          >
            {passwordStrengthText}
          </Text>
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
   * A custom component to replace the title Text component
   * titleText will be ignored if this is provided
   */
  TitleTextCustomComponent: PropTypes.node,
  /**
   * Show unit (eg. ETH)
   */
  titleUnit: PropTypes.string,
  /**
   * A custom component to replace the title unit Text component
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
   * Props to pass to wrapping Box component of the titleHeading component
   * Accepts all props of the Box component
   */
  titleHeadingWrapperProps: PropTypes.shape({
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
   * Props to pass to the warning text component
   * Accepts all props of the Text component
   */
  warningProps: PropTypes.shape({
    ...Text.propTypes,
  }),
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
  /**
   * ref for input component
   */
  inputRef: PropTypes.object,
};
