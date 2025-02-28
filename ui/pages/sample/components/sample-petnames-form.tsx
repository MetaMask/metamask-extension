import React, { useState, useEffect } from 'react';
import { Hex } from '@metamask/utils';
import {
  Box,
  Text,
  Button,
  FormTextField,
  HelpText,
  HelpTextSeverity,
} from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  Display,
  FlexDirection,
  AlignItems,
  TextAlign,
  TextVariant,
  JustifyContent,
  BorderRadius,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { usePetnames } from '../../../ducks/metamask/sample-petnames-duck';

// Define validation utilities
const validateAddress = (address: string): string | undefined => {
  if (!address) {
    return 'Address is required';
  }

  if (!address.startsWith('0x') || address.length !== 42) {
    return 'Invalid Ethereum address format';
  }

  return undefined;
};

const validatePetName = (name: string): string | undefined => {
  if (!name) {
    return 'Pet name is required';
  }

  if (name.trim() === '') {
    return 'Pet name cannot be empty';
  }

  if (name.length > 32) {
    return 'Pet name must be 32 characters or less';
  }

  return undefined;
};

type FormState = {
  address: string;
  petName: string;
};

type ErrorState = {
  address?: string;
  petName?: string;
  form?: string;
};

export function SamplePetnamesForm() {
  const petNames = usePetnames();
  const [values, setValues] = useState<FormState>({
    address: '',
    petName: '',
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<'default' | 'success' | 'error'>(
    'default',
  );

  // Validate inputs on change
  useEffect(() => {
    const addressError = validateAddress(values.address);
    const petNameError = validatePetName(values.petName);

    setErrors({
      address: values.address ? addressError : undefined,
      petName: values.petName ? petNameError : undefined,
    });

    // Reset form state when inputs change
    if (formState === 'error' || formState === 'success') {
      setFormState('default');
    }
  }, [values, formState]);

  const handleInputChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues({
        ...values,
        [field]: e.target.value,
      });
    };

  const handleSubmit = async () => {
    // Final validation before submission
    const addressError = validateAddress(values.address);
    const petNameError = validatePetName(values.petName);

    const hasErrors = Boolean(addressError || petNameError);

    if (hasErrors) {
      setErrors({
        address: addressError,
        petName: petNameError,
      });
      setFormState('error');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      await petNames.assignPetname(values.address as Hex, values.petName);

      // Handle success
      setFormState('success');
      setValues({
        address: '',
        petName: '',
      });
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Failed to add pet name',
      });
      setFormState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    values.address && values.petName && !errors.address && !errors.petName;

  return (
    <Card>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text variant={TextVariant.headingSm}>Pet Names on this network</Text>

        {/* Pet Names List */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          style={{ width: '100%', minWidth: '300px' }}
        >
          {Object.entries(petNames.namesForCurrentChain).length === 0 ? (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              textAlign={TextAlign.Center}
            >
              No pet names added yet
            </Text>
          ) : (
            Object.entries(petNames.namesForCurrentChain).map(
              ([addr, name]) => (
                <Box
                  key={addr}
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  padding={2}
                  backgroundColor={BackgroundColor.backgroundAlternative}
                  borderRadius={BorderRadius.LG}
                >
                  <Text>{name}</Text>
                  <Text
                    color={TextColor.textAlternative}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '120px',
                    }}
                  >
                    {addr}
                  </Text>
                </Box>
              ),
            )
          )}
        </Box>

        {/* Form */}
        <Box
          as="form"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          style={{ width: '100%' }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <FormTextField
            label="Address"
            id="address"
            name="address"
            placeholder="0x..."
            value={values.address}
            onChange={handleInputChange('address')}
            disabled={isSubmitting}
            error={Boolean(formState === 'error' && errors.address)}
            helpText={formState === 'error' ? errors.address : undefined}
            required
          />

          <FormTextField
            label="Name"
            id="petName"
            name="petName"
            placeholder="Enter a nickname"
            value={values.petName}
            onChange={handleInputChange('petName')}
            disabled={isSubmitting}
            error={Boolean(formState === 'error' && errors.petName)}
            helpText={formState === 'error' ? errors.petName : undefined}
            required
          />

          {errors.form && (
            <HelpText severity={HelpTextSeverity.Danger} marginBottom={2}>
              {errors.form}
            </HelpText>
          )}

          {formState === 'success' && (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.successDefault}
              textAlign={TextAlign.Center}
              marginBottom={2}
            >
              Pet name added successfully!
            </Text>
          )}

          <Button type="submit" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? 'Adding...' : 'Add Pet Name'}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
