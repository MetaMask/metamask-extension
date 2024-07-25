import React, { useCallback } from 'react';

import { useCopyToClipboard } from '../../../../../hooks/useCopyToClipboard';
import { IconColor } from '../../../../../helpers/constants/design-system';
import { Icon, IconName, IconSize } from '../../../../component-library';

type CopyCallback = (text: string) => void;

export const CopyIcon: React.FC<{ copyText: string }> = ({ copyText }) => {
  const [copied, handleCopy] = useCopyToClipboard();

  const handleClick = useCallback(async () => {
    (handleCopy as CopyCallback)(copyText);
  }, [copyText]);

  return (
    <Icon
      color={IconColor.iconAlternative}
      name={copied ? IconName.CopySuccess : IconName.Copy}
      size={IconSize.Sm}
      style={{ cursor: 'pointer', position: 'absolute', right: 0, top: 2 }}
      onClick={handleClick}
    />
  );
};
