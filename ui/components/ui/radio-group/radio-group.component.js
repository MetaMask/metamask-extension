import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Typography from '../typography/typography';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';

export default function RadioGroup({ options, name, selectedValue, onChange }) {
  const t = useContext(I18nContext);

  return (
    <div className="radio-group">
      {options.map((option) => {
        return (
          <div className="radio-group__column" key={`${name}-${option.value}`}>
            <label>
              <Typography
                color={COLORS.SUCCESS3}
                className="radio-group__column-recommended"
                variant={TYPOGRAPHY.H7}
              >
                {option.recommended ? t('recommendedGasLabel') : ''}
              </Typography>

              <div className="radio-group__column-radio">
                <input
                  type="radio"
                  name={name}
                  defaultChecked={option.value === selectedValue}
                  value={option.value}
                  onChange={() => onChange?.(option.value)}
                />
              </div>
              <div className="radio-group__column-line"></div>
              <div className="radio-group__column-horizontal-line"></div>
              <Typography
                color={COLORS.UI4}
                fontWeight={FONT_WEIGHT.BOLD}
                variant={TYPOGRAPHY.H7}
                className="radio-group__column-label"
              >
                {option.label}
              </Typography>
            </label>
          </div>
        );
      })}
    </div>
  );
}

RadioGroup.propTypes = {
  options: PropTypes.array,
  selectedValue: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
};

RadioGroup.defaultProps = {
  options: [],
};
