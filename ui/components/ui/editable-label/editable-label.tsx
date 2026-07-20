import React, { useCallback, useState } from 'react';
import classnames from 'clsx';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Box,
  BoxAlignItems,
  FormTextField,
} from '@metamask/design-system-react';
import {
  TextVariant,
  IconColor,
} from '../../../helpers/constants/design-system';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import { ButtonIcon, IconName, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

type EditableLabelProps = {
  onSubmit: (value: string) => Promise<void>;
  defaultValue?: string;
  className?: string;
  accounts?: InternalAccount[];
};

export default function EditableLabel({
  onSubmit,
  defaultValue,
  className,
  accounts,
}: EditableLabelProps) {
  const t = useI18nContext();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(defaultValue || '');

  const handleSubmit = useCallback(
    async (isValidAccountName: boolean) => {
      if (!isValidAccountName) {
        return;
      }

      await onSubmit(value.trim());
      setIsEditing(false);
    },
    [onSubmit, value],
  );

  if (isEditing) {
    const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
      accounts,
      { t },
      value,
      defaultValue,
    );
    return (
      <Box className={classnames('flex editable-label', className)} gap={3}>
        <FormTextField
          required
          value={value}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value);
          }}
          inputProps={{
            onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') {
                handleSubmit(isValidAccountName);
              }
            },
          }}
          data-testid="editable-input"
          isError={!isValidAccountName}
          helpText={errorMessage}
          autoFocus
          placeholder={t('accountName')?.toString() ?? ''}
        />
        <ButtonIcon
          iconName={IconName.Check}
          ariaLabel={t('save')?.toString() ?? ''}
          onClick={() => handleSubmit(isValidAccountName)}
          data-testid="save-account-label-input"
        />
      </Box>
    );
  }

  return (
    <Box className="flex" alignItems={BoxAlignItems.Center} gap={3}>
      <Text
        variant={TextVariant.bodyLgMedium}
        style={{ wordBreak: 'break-word' }}
      >
        {value}
      </Text>
      <ButtonIcon
        iconName={IconName.Edit}
        ariaLabel={t('edit')?.toString() ?? ''}
        data-testid="editable-label-button"
        onClick={() => setIsEditing(true)}
        color={IconColor.iconDefault}
      />
    </Box>
  );
}
