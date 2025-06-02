import React, { useCallback } from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  Box,
} from '../../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useHistory, useParams } from 'react-router-dom';

export const EditNetwork: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  const handleGoBack = () => {
    history.push('/');
  };

  const handleSaveNetwork = useCallback(() => {
    console.log('save network with id:', id);
    // TODO: Implement save logic
    // Navigate back to main network manager after save
    handleGoBack();
  }, [handleGoBack, id]);

  const handleDeleteNetwork = useCallback(() => {
    console.log('delete network with id:', id);
    // TODO: Implement delete logic
    // Navigate back to main network manager after delete
    handleGoBack();
  }, [handleGoBack, id]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.stretch}
      padding={4}
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        marginBottom={4}
      >
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          size={ButtonIconSize.Sm}
          onClick={handleGoBack}
          ariaLabel="Go back"
        />
        <Text variant={TextVariant.headingMd}>Edit Network</Text>
        <Box style={{ width: '24px' }} />
      </Box>

      <Box>
        <Text variant={TextVariant.bodyMd}>
          Edit network configuration for ID: {id}
        </Text>
        {/* TODO: Add form components for network configuration */}
        <Box marginTop={4} display={Display.Flex} gap={2}>
          <button onClick={handleSaveNetwork}>Save Changes</button>
          <button onClick={handleDeleteNetwork}>Delete Network</button>
        </Box>
      </Box>
    </Box>
  );
};
