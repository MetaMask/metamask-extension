import React, { useCallback } from 'react';

import { TextField } from '../../../../../components/component-library';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { useSendContext } from '../../../context/send';

export const Recipient = ({ setTo }: { setTo: (to?: string) => void }) => {
  const { handleSubmit } = useSendActions();
  const { to, updateTo } = useSendContext();

  const onChange = useCallback(
    (e) => {
      const toAddress = e.target.value;
      setTo(to);
      updateTo(toAddress);
    },
    [setTo, updateTo],
  );

  return (
    <div>
      <p>TO</p>
      <TextField value={to} onChange={onChange} />
    </div>
  );
};
