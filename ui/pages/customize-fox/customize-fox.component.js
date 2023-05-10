import React from 'react';
import { useSelector } from 'react-redux';
import { getMetaMaskAccountsOrdered } from '../../selectors';

export default function CustomizeFoxComponent() {
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  console.log({ accounts });

  return (
    <div className="customized-fox">
      Wrapper
      <div>More</div>
    </div>
  );
}
