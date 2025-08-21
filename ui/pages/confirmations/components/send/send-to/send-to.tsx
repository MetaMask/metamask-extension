import React from 'react';

import { Button } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';

export const SendTo = () => {
  const { goToPreviousPage } = useNavigateSendPage();

  return (
    <div>
      <p>TO</p>
      <Button onClick={goToPreviousPage}>Previous</Button>
      <Button>Continue</Button>
    </div>
  );
};
