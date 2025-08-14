import React from 'react';

import { Button } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';

export const Amount = () => {
  const { goToSendToPage, goToPreviousPage } = useNavigateSendPage();

  return (
    <div>
      <p>AMOUNT</p>
      <Button onClick={goToPreviousPage}>Previous</Button>
      <Button onClick={goToSendToPage}>Continue</Button>
    </div>
  );
};
