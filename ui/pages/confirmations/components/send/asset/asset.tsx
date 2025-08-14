import React from 'react';

import { Button } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';

export const Asset = () => {
  const { goToAmountPage, goToPreviousPage } = useNavigateSendPage();

  return (
    <div>
      <p>asset</p>
      <Button onClick={goToPreviousPage}>Previous</Button>
      <Button onClick={goToAmountPage}>Continue</Button>
    </div>
  );
};
