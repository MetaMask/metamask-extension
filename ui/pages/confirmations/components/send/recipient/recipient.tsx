import React, { useCallback } from 'react';

import { TextField } from '../../../../../components/component-library';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useSendContext } from '../../../context/send';

export const Recipient = ({ setTo }: { setTo: (to?: string) => void }) => {
  const { to, updateTo } = useSendContext();
  const { captureRecipientSelected } = useRecipientSelectionMetrics();

  const onChange = useCallback(
    (e) => {
      const toAddress = e.target.value;
      setTo(toAddress);
      updateTo(toAddress);
    },
    [setTo, updateTo],
  );

  const captureMetrics = useCallback(() => {
    if (!to) {
      return;
    }
    captureRecipientSelected();
  }, [captureRecipientSelected]);

  return (
    <div>
      <p>TO</p>
      <TextField value={to} onChange={onChange} onBlur={captureMetrics} />
    </div>
  );
};
