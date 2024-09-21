import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { BorderColor } from '../../../helpers/constants/design-system';
import Chip from '.';

export function ChipWithInput({
  dataTestId,
  className,
  borderColor = BorderColor.borderDefault,
  inputValue,
  setInputValue,
}) {
  return (
    <Chip
      className={classnames(className, 'chip--with-input')}
      borderColor={borderColor}
    >
      {setInputValue && (
        <input
          data-testid={dataTestId}
          type="text"
          className="chip__input"
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          value={inputValue}
        />
      )}
    </Chip>
  );
}

ChipWithInput.propTypes = {
  dataTestId: PropTypes.string,
  borderColor: PropTypes.oneOf(Object.values(BorderColor)),
  className: PropTypes.string,
  inputValue: PropTypes.string,
  setInputValue: PropTypes.func,
};
