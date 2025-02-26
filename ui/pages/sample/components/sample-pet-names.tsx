import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  TextField,
  Label,
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
import { useAsyncResult } from '../../../hooks/useAsync';
import { usePetNames } from '../../../ducks/sample/pet-names';

export function SamplePetNames() {
  const petNames = usePetNames();
  const [address, setAddress] = useState('');
  const [petName, setPetName] = useState('');

  const petNameAddResult = useAsyncResult(async () => {
    if (!address || !petName) {
      throw new Error('Please enter both address and name');
    }

    await petNames.assignPetName(address, petName);
    setAddress('');
    setPetName('');
  }, [address, petName, petNames]);

  return (
    <Card>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text variant={TextVariant.headingSm}>Pet Names</Text>

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

        {/* Add Pet Name Form */}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          style={{ width: '100%' }}
        >
          <Label>
            <Text variant={TextVariant.bodyMd} marginBottom={1}>
              Address
            </Text>
            <TextField
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              disabled={petNameAddResult.pending}
            />
          </Label>
          <Label>
            <Text variant={TextVariant.bodyMd} marginBottom={1}>
              Name
            </Text>
            <TextField
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Enter a nickname"
              disabled={petNameAddResult.pending}
            />
          </Label>
          <Button
            onClick={() => {
              if (!petNameAddResult.pending) {
                petNames.assignPetName(address, petName);
              }
            }}
            disabled={petNameAddResult.pending || !address || !petName}
          >
            {petNameAddResult.pending ? 'Adding...' : 'Add Pet Name'}
          </Button>
        </Box>

        {petNameAddResult.error && (
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.errorDefault}
            textAlign={TextAlign.Center}
          >
            {petNameAddResult.error.message}
          </Text>
        )}
      </Box>
    </Card>
  );
}
