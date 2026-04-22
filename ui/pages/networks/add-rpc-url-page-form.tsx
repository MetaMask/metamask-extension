import React, { useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
} from '../../components/component-library/form-text-field';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../helpers/constants/design-system';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { isWebUrl } from '../../../app/scripts/lib/util';

type AddRpcUrlPageFormProps = {
  onCancel: () => void;
  onAdded: (url: string, name?: string) => void;
};

export const AddRpcUrlPageForm = ({
  onCancel,
  onAdded,
}: AddRpcUrlPageFormProps) => {
  const t = useI18nContext();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const error = useMemo(() => {
    if (!url) {
      return undefined;
    }

    if (isWebUrl(url)) {
      return undefined;
    }

    if (isWebUrl(`https://${url}`)) {
      return t('urlErrorMsg');
    }

    return t('invalidRPC');
  }, [t, url]);

  const isSubmitDisabled = !url.trim() || Boolean(error);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex h-full w-full min-h-0 flex-col"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="flex min-h-0 flex-1 flex-col overflow-auto"
        style={{ scrollbarColor: 'var(--color-icon-muted) transparent' }}
      >
        <Box className="flex w-full flex-col gap-6 px-4 pt-4">
          <FormTextField
            id="rpcUrl"
            label={t('rpcUrl')}
            placeholder={t('enterRpcUrl')}
            value={url}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setUrl(event.target.value)
            }
            error={Boolean(error)}
            helpText={error}
            size={FormTextFieldSize.Lg}
            labelProps={{ marginBottom: 1 }}
            textFieldProps={{
              backgroundColor: BackgroundColor.backgroundMuted,
              borderColor: BorderColor.borderMuted,
              borderRadius: BorderRadius.XL,
              style: { borderColor: 'var(--color-border-muted)' },
            }}
            inputProps={{
              'data-testid': 'rpc-url-input-test',
            }}
            autoFocus
          />
          <FormTextField
            id="rpcName"
            label={t('rpcNameOptional')}
            placeholder={t('enterANameToIdentifyTheUrl')}
            value={name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setName(event.target.value)
            }
            size={FormTextFieldSize.Lg}
            labelProps={{ marginBottom: 1 }}
            textFieldProps={{
              backgroundColor: BackgroundColor.backgroundMuted,
              borderColor: BorderColor.borderMuted,
              borderRadius: BorderRadius.XL,
              style: { borderColor: 'var(--color-border-muted)' },
            }}
            inputProps={{
              'data-testid': 'rpc-name-input-test',
            }}
          />
        </Box>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        padding={4}
        paddingBottom={6}
        className="shrink-0 flex-row"
      >
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border-default"
          data-testid="page-container-footer-cancel"
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isDisabled={isSubmitDisabled}
          onClick={() => onAdded(url, name || undefined)}
          className="flex-1 rounded-xl"
          data-testid="page-container-footer-next"
        >
          {t('addUrl')}
        </Button>
      </Box>
    </Box>
  );
};
