import React from 'react';
import MaterialSlider from '@material-ui/core/Slider';
import { withStyles } from '@material-ui/core/styles';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import InfoTooltip from '../../../ui/info-tooltip/info-tooltip';

/**
 * Material UI styles for the slider - uses CSS variables for theming
 */
const sliderStyles = {
  root: {
    height: 6,
    padding: '6px 0',
  },
  rail: {
    borderRadius: 50,
    background: 'var(--color-background-hover)',
    height: 6,
  },
  track: {
    borderRadius: 50,
    background: 'var(--color-background-muted)',
    height: 6,
  },
  thumb: {
    height: 20,
    width: 20,
    marginTop: -7,
    marginLeft: -7,
    backgroundColor: 'var(--color-primary-inverse)',
    border: '2px solid var(--color-primary-inverse)',
    boxSizing: 'border-box' as const,
    boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    '&:focus, &$active': {
      height: 20,
      width: 20,
      marginTop: -7,
      marginLeft: -7,
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    },
    '&:hover': {
      height: 22,
      width: 22,
      marginTop: -8,
      marginLeft: -8,
      backgroundColor: 'var(--color-primary-inverse)',
      border: '2px solid var(--color-primary-inverse)',
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    },
  },
  active: {},
};

const StyledMaterialSlider = withStyles(sliderStyles)(MaterialSlider);

export type PerpsSliderProps = {
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step: number;
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (
    event: React.ChangeEvent<unknown>,
    value: number | number[],
  ) => void;
  /** Show edit text */
  editText?: string | React.ReactNode;
  /** Show info text */
  infoText?: string | React.ReactNode;
  /** Handler for onEdit */
  onEdit?: () => void;
  /** Show title detail text */
  titleDetail?: string | React.ReactNode;
  /** Show title text */
  titleText?: string | React.ReactNode;
  /** Show tooltip text */
  tooltipText?: string | React.ReactNode;
  /** Show value text */
  valueText?: string | React.ReactNode;
  /** Test ID for testing */
  'data-testid'?: string;
};

export const PerpsSlider: React.FC<PerpsSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  editText = 'Edit',
  infoText,
  onEdit,
  titleDetail,
  titleText,
  tooltipText,
  valueText,
  'data-testid': dataTestId,
}) => {
  const hasHeader = titleText || tooltipText || valueText || titleDetail;
  const hasFooter = infoText || onEdit;

  return (
    <Box className="w-full inline-block">
      {/* Header */}
      {hasHeader && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            {titleText && (
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Bold}>
                {titleText}
              </Text>
            )}
            {tooltipText && typeof tooltipText === 'string' && (
              <InfoTooltip position="top" contentText={tooltipText} />
            )}
            {valueText && (
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {valueText}
              </Text>
            )}
          </Box>
          {titleDetail && (
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {titleDetail}
            </Text>
          )}
        </Box>
      )}

      {/* Slider */}
      <StyledMaterialSlider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        data-testid={dataTestId}
      />

      {/* Footer */}
      {hasFooter && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
          >
            {infoText && (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {infoText}
              </Text>
            )}
          </Box>
          {onEdit && (
            <button
              onClick={onEdit}
              aria-label="edit as numeric input"
              className="border-none bg-transparent text-xs text-[color:var(--color-primary-default)] focus:outline-none"
            >
              {editText}
            </button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PerpsSlider;
