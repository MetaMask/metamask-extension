import React from 'react';
import { Slider as MaterialSlider } from '@mui/material';
import { styled } from '@mui/material/styles';
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

const StyledMaterialSlider = styled(MaterialSlider)({
  height: 4,
  padding: 0,
  overflow: 'visible',
  '& .MuiSlider-rail': {
    borderRadius: 50,
    background: 'var(--color-border-muted)',
    height: 4,
    opacity: 1,
  },
  '& .MuiSlider-track': {
    borderRadius: 50,
    background: 'var(--color-text-default)',
    height: 4,
    border: 'none',
    minHeight: 4,
  },
  '& .MuiSlider-thumb': {
    height: 16,
    width: 16,
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    backgroundColor: '#414243',
    border: '2px solid var(--color-text-default)',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    '[data-theme="dark"] &': {
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      backgroundColor: '#CCCCCC',
    },
    '&::before': {
      display: 'none',
    },
    '&:focus, &.Mui-active': {
      height: 16,
      width: 16,
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
    },
    '&:hover': {
      height: 18,
      width: 18,
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      backgroundColor: '#414243',
      border: '2px solid var(--color-text-default)',
      boxShadow: 'var(--shadow-size-md) var(--color-shadow-default)',
      '[data-theme="dark"] &': {
        // eslint-disable-next-line @metamask/design-tokens/color-no-hex
        backgroundColor: '#CCCCCC',
      },
    },
    '&.Mui-disabled': {
      height: 16,
      width: 16,
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      backgroundColor: '#414243',
      border: '2px solid var(--color-text-default)',
      boxSizing: 'border-box',
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
  '& .MuiSlider-mark': {
    width: 2,
    height: 2,
    borderRadius: '50%',
    backgroundColor: 'var(--color-icon-alternative)',
    // MUI v5 default is translate(-1px, -50%) which shifts marks 1px left.
    // Override to translate(1px, -50%) to correct horizontal alignment.
    transform: 'translate(1px, -50%)',
  },
  '& .MuiSlider-markActive': {
    backgroundColor: 'var(--color-icon-alternative)',
    opacity: 1,
  },
});

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
    event: Event,
    value: number | number[],
    activeThumb: number,
  ) => void;
  /** Committed change handler - fires only when drag ends or a discrete click occurs */
  onChangeCommitted?: (
    event: React.SyntheticEvent | Event,
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
