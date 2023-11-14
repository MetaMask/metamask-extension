import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  BlockSize,
  FlexDirection,
  TextVariant,
  BackgroundColor,
  TextColor,
  BorderRadius,
  BorderStyle,
} from '../../../helpers/constants/design-system';
import { ButtonVariant, Box, Button, Text } from '../../component-library';
import TextArea from '../../ui/textarea';
import TextField from '../../ui/text-field';
import JwtDropdown from '../jwt-dropdown';

const JwtUrlForm = (props) => {
  const t = useI18nContext();
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const showJwtDropdown = props.jwtList.length >= 1;

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
      marginBottom={8}
    >
      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        marginTop={4}
        alignItems={AlignItems.center}
        marginBottom={4}
      >
        {showJwtDropdown && (
          <JwtDropdown
            key={props.currentJwt}
            data-testid="jwt-dropdown"
            currentJwt={props.currentJwt ? props.currentJwt : props.jwtList[0]}
            jwtList={props.jwtList}
            onChange={(value) => {
              props.onJwtChange(value);
            }}
          />
        )}

        {showJwtDropdown && !addNewTokenClicked && (
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            marginTop={2}
          >
            <Text>{t('or')}</Text>
            <Button
              data-testid="addNewToken-btn"
              variant={ButtonVariant.Secondary}
              onClick={() => {
                props.onJwtChange('');
                setAddNewTokenClicked(true);
              }}
            >
              {t('addNewToken')}
            </Button>
          </Box>
        )}
        {(!showJwtDropdown || addNewTokenClicked) && (
          <Box width={BlockSize.Full}>
            <Text
              display={Display.Block}
              variant={TextVariant.bodyMd}
              marginBottom={4}
            >
              {props.jwtInputText}
            </Text>

            <TextArea
              data-testid="jwt-input"
              id="jwt-box"
              onChange={(e) => {
                props.onJwtChange(e.target.value);
              }}
              value={props.currentJwt}
              autoFocus
              height="154px"
              resize="both"
              boxProps={{
                borderRadius: BorderRadius.SM,
                borderStyle: BorderStyle.solid,
                backgroundColor: BackgroundColor.backgroundDefault,
                color: TextColor.textDefault,
                padding: 2,
              }}
            />
          </Box>
        )}
      </Box>
      <Box width={BlockSize.Full}>
        <Text display={Display.Block} variant={TextVariant.bodyMd}>
          {props.urlInputText}
        </Text>
        <Box marginTop={4}>
          <TextField
            fullWidth
            id="api-url-box"
            data-testid="jwt-api-url-input"
            type="text"
            onChange={(e) => {
              props.onUrlChange(e.target.value);
            }}
            value={props.apiUrl}
            inputProps={{
              backgroundColor: BackgroundColor.backgroundDefault,
              color: TextColor.textDefault,
              padding: 2,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

JwtUrlForm.propTypes = {
  jwtList: PropTypes.array.isRequired,
  onUrlChange: PropTypes.func.isRequired,
  onJwtChange: PropTypes.func.isRequired,
  currentJwt: PropTypes.string,
  jwtInputText: PropTypes.string,
  apiUrl: PropTypes.string,
  urlInputText: PropTypes.string,
};

export default JwtUrlForm;
