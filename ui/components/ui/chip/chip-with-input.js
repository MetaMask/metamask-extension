import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import Chip from '.';
import { BorderColor } from '../../../helpers/constants/design-system';

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
          // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
          // eslint-disable-next-line id-length
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
