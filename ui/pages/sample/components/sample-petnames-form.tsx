import React from 'react';
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
import { useSamplePetnamesController } from '../../../ducks/metamask/sample-petnames-controller';
import { useSamplePetnamesForm } from '../hooks/useSamplePetnamesForm';

export function SamplePetnamesForm() {
  const petNames = useSamplePetnamesController();
  const {
    isSubmitting,
    formStatus,
    submissionError,
    isFormValid,
    handleSubmit,
    getFieldProps,
  } = useSamplePetnamesForm();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

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
          onSubmit={onSubmit}
        >
          <FormTextField
            label="Address"
            id="address"
            placeholder="0x..."
            required
            {...getFieldProps('address')}
          />

          <FormTextField
            label="Name"
            id="petName"
            placeholder="Enter a nickname"
            required
            {...getFieldProps('petName')}
          />

          {submissionError && (
            <HelpText severity={HelpTextSeverity.Danger} marginBottom={2}>
              {submissionError}
            </HelpText>
          )}

          {formStatus === 'success' && (
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
