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
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import Tooltip from '../../../ui/tooltip';

/**
 * Material UI styles for the slider - uses CSS variables for theming.
 * MUI v4's default Slider shrinks the thumb to 8×8 when disabled; we keep the
 * same size as enabled so $0 available / disabled sliders still look correct.
 */
const sliderStyles = {
  root: {
    height: 4,
    padding: 0,
    overflow: 'visible',
  },
  /** Required for JSS `$disabled` references on root/thumb */
  disabled: {},
  rail: {
    borderRadius: 50,
    background: 'var(--color-border-muted)',
    height: 4,
    opacity: 1,
  },
  track: {
    borderRadius: 50,
    background: 'var(--color-text-default)',
    height: 4,
  },
  thumb: {
    height: 16,
    width: 16,
    marginTop: -6,
    marginLeft: -5,
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    backgroundColor: '#414243',
    border: '2px solid var(--color-text-default)',
    boxSizing: 'border-box' as const,
    boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    '[data-theme="dark"] &': {
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      backgroundColor: '#CCCCCC',
    },
    '&:focus, &$active': {
      height: 16,
      width: 16,
      marginTop: -6,
      marginLeft: -5,
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    },
    '&:hover': {
      height: 18,
      width: 18,
      marginTop: -7,
      marginLeft: -6,
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      backgroundColor: '#414243',
      border: '2px solid var(--color-text-default)',
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
      '[data-theme="dark"] &': {
        // eslint-disable-next-line @metamask/design-tokens/color-no-hex
        backgroundColor: '#CCCCCC',
      },
    },
    '&$disabled': {
      height: 16,
      width: 16,
      marginTop: -6,
      marginLeft: -5,
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      backgroundColor: '#414243',
      border: '2px solid var(--color-text-default)',
      boxSizing: 'border-box' as const,
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
      '[data-theme="dark"] &': {
        // eslint-disable-next-line @metamask/design-tokens/color-no-hex
        backgroundColor: '#CCCCCC',
      },
      '&:hover': {
        boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
      },
    },
  },
  active: {},
  mark: {
    width: 2,
    height: 2,
    borderRadius: '50%',
    backgroundColor: 'var(--color-icon-alternative)',
    marginTop: 1,
  },
  markActive: {
    backgroundColor: 'var(--color-icon-alternative)',
    opacity: 1,
  },
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
  /** Change handler - fires continuously during drag */
  onChange: (
    event: React.ChangeEvent<unknown>,
    value: number | number[],
  ) => void;
  /** Committed change handler - fires only when drag ends or a discrete click occurs */
  onChangeCommitted?: (
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
  /** When true, the slider is non-interactive */
  disabled?: boolean;
  /** Show tick marks at every Nth step (e.g. 5 = tick every 5 steps) */
  markInterval?: number;
};

export const PerpsSlider: React.FC<PerpsSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  onChangeCommitted,
  editText = 'Edit',
  infoText,
  onEdit,
  titleDetail,
  titleText,
  tooltipText,
  valueText,
  'data-testid': dataTestId,
  disabled = false,
  markInterval,
}) => {
  const hasHeader = titleText || tooltipText || valueText || titleDetail;
  const hasFooter = infoText || onEdit;

  const marks = React.useMemo(() => {
    if (!markInterval || markInterval * step <= 0) {
      return undefined;
    }
    const result: { value: number }[] = [];
    for (let i = min; i <= max; i += markInterval * step) {
      result.push({ value: i });
    }
    return result;
  }, [markInterval, min, max, step]);

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
              <Tooltip position="top" html={tooltipText} interactive>
                <Icon
                  name={IconName.Info}
                  size={IconSize.Sm}
                  color={IconColor.IconAlternative}
                />
              </Tooltip>
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
        onChangeCommitted={onChangeCommitted}
        disabled={disabled}
        marks={marks}
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
