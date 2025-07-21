import React from 'react';
import { Switch, Route } from 'react-router-dom';
import ConfirmTransactionSwitch from '../confirm-transaction-switch';

export default function ConfirmTokenTransactionSwitch() {
  return (
    <Switch>
      <Route path="*" component={ConfirmTransactionSwitch} />
    </Switch>
  );
}
