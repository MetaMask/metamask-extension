import React from 'react';
import {
  Button,
  ButtonSize,
  Box,
  ButtonIcon,
  IconName,
  IconColor,
} from '@metamask/design-system-react';
import {
  Label,
  TextField,
  TextFieldSize,
  TextFieldType,
  HelpText,
  HelpTextSeverity,
} from '../../components/component-library';
import { BlockSize } from '../../helpers/constants/design-system';

interface PasswordPromptProps {
  password: string;
  error: string | null;
  showPassword: boolean;
  passwordLabel: string;
  continueLabel: string;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: (event: React.MouseEvent) => void;
  onSubmit: (event: React.MouseEvent | React.FormEvent) => void;
  onContinueClick: (event: React.MouseEvent) => void;
}

export function PasswordPrompt({
  password,
  error,
  showPassword,
  passwordLabel,
  continueLabel,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmit,
  onContinueClick,
}: PasswordPromptProps) {
  return (
    <>
      <form onSubmit={onSubmit} data-testid="reveal-seed-password-form">
        <Label htmlFor="password-box">{passwordLabel}</Label>
        <TextField
          inputProps={{
            'data-testid': 'input-password',
          }}
          type={showPassword ? TextFieldType.Text : TextFieldType.Password}
          id="password-box"
          size={TextFieldSize.Lg}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          error={Boolean(error)}
          width={BlockSize.Full}
          endAccessory={
            <ButtonIcon
              iconName={showPassword ? IconName.EyeSlash : IconName.Eye}
              ariaLabel={showPassword ? 'Hide password' : 'Show password'}
              onClick={onTogglePasswordVisibility}
              iconProps={{
                color: IconColor.IconAlternative,
              }}
            />
          }
        />
        {error && (
          <HelpText
            severity={HelpTextSeverity.Danger}
            data-testid="reveal-seed-password-error"
          >
            {error}
          </HelpText>
        )}
      </form>
      <Box
        gap={4}
        data-testid="reveal-seed-password-footer"
        className="w-full"
      >
        <Button
          size={ButtonSize.Lg}
          onClick={onContinueClick}
          disabled={password === ''}
          data-testid="reveal-seed-password-continue"
          className='w-full'
        >
          {continueLabel}
        </Button>
      </Box>
    </>
  );
}
