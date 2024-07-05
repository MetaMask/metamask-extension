import React, { useCallback, useState } from 'react';

import { IconColor } from '../../../../../helpers/constants/design-system';
import { Icon, IconName, IconSize } from '../../../../component-library';

export const CopyIcon: React.FC<{ copyText: string }> = ({ copyText }) => {
  const [success, setSuccess] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setSuccess(true);
    } catch (error: unknown) {
      console.error(error);
    }
  }, [copyText]);

  return (
    <Icon
      color={IconColor.iconAlternative}
      name={success ? IconName.CopySuccess : IconName.Copy}
      size={IconSize.Sm}
      style={{ cursor: 'pointer', position: 'absolute', right: 0, top: 2 }}
      onClick={copyToClipboard}
    />
  );
};
