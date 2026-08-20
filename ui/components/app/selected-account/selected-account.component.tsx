import React, { useCallback } from 'react';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { shortenAddress } from '../../../helpers/utils/util';

import Tooltip from '../../ui/tooltip';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { Icon, IconName, IconSize, Text } from '../../component-library';
import {
  IconColor,
  TextVariant,
  TextColor,
  TextAlign,
  BlockSize,
  Display,
  FontWeight,
  AlignItems,
} from '../../../helpers/constants/design-system';

type SelectedAccountProps = {
  selectedAccount: InternalAccount;
};

function SelectedAccount({ selectedAccount }: SelectedAccountProps) {
  const t = useI18nContext();
  const [copied, copyToClipboard] = useCopyToClipboard({
    clearDelayMs: null,
  });

  const checksummedAddress = toChecksumHexAddress(selectedAccount.address);

  const title = copied ? t('copiedExclamation') : t('copyToClipboard');

  const showAccountCopyIcon = true;

  const handleCopy = useCallback(() => {
    copyToClipboard(checksummedAddress);
  }, [checksummedAddress, copyToClipboard]);

  return (
    <div className="selected-account">
      <Tooltip
        wrapperClassName="selected-account__tooltip-wrapper"
        position="bottom"
        title={title}
      >
        <button
          className="selected-account__clickable"
          data-testid="selected-account-click"
          onClick={handleCopy}
        >
          <Text
            data-testid="selected-account-name"
            width={BlockSize.Full}
            fontWeight={FontWeight.Medium}
            color={TextColor.textDefault}
            ellipsis
            textAlign={TextAlign.Center}
            marginBottom={1}
          >
            {selectedAccount.metadata.name}
          </Text>
          <Text
            data-testid="selected-account-address"
            variant={TextVariant.bodyXs}
            color={TextColor.textAlternative}
            display={Display.Flex}
            alignItems={AlignItems.center}
          >
            {shortenAddress(checksummedAddress)}
            {showAccountCopyIcon && (
              <div
                data-testid="selected-account-copy"
                className="selected-account__copy"
              >
                <Icon
                  name={copied ? IconName.CopySuccess : IconName.Copy}
                  size={IconSize.Sm}
                  color={IconColor.iconAlternative}
                />
              </div>
            )}
          </Text>
        </button>
      </Tooltip>
    </div>
  );
}

export default SelectedAccount;
