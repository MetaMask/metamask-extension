import React from 'react';

import { Button } from '../../../../../components/component-library';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { Header } from '../header';

export const Asset = () => {
  const { goToAmountRecipientPage, goToPreviousPage } = useNavigateSendPage();

  return (
    <div className="send__wrapper">
      <div className="send__container">
        <div className="send__content">
          <Header />
          <p>asset</p>
          <Button onClick={goToPreviousPage}>Previous</Button>
          <Button onClick={goToAmountRecipientPage}>Continue</Button>
        </div>
      </div>
    </div>
  );
};
