import React from 'react';
import { useSelector } from 'react-redux';

import { currentConfirmationSelector } from '../../../../selectors/confirm';

const Header = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);

  return (
    <div>
      CONFIRM HEADER COMPONENT <br />
      {currentConfirmation?.id}
    </div>
  );
};

export default Header;
