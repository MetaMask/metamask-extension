import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  BlockSize,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ButtonVariant, Box, Button, Text } from '../../component-library';
import JwtDropdown from '../jwt-dropdown';

const JwtUrlForm = (props) => {
  const t = useI18nContext();
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const showJwtDropdown = props.jwtList.length >= 1;

  return (
    <Box
      className="jwt-url-form"
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
        className="jwt-url-form__jwt-container"
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
              className="jwt-url-form__instruction"
              display={Display.Block}
              variant={TextVariant.bodyMd}
              marginBottom={4}
            >
              {props.jwtInputText}
            </Text>

            <textarea
              className="jwt-url-form__input-jwt"
              data-testid="jwt-input"
              id="jwt-box"
              onChange={(e) => {
                props.onJwtChange(e.target.value);
              }}
              value={props.currentJwt}
              autoFocus
            />
          </Box>
        )}
      </Box>
      <Box width={BlockSize.Full}>
        <Text
          className="jwt-url-form__instruction"
          display={Display.Block}
          variant={TextVariant.bodyMd}
        >
          {props.urlInputText}
        </Text>
        <Box marginTop={4}>
          <input
            type="text"
            className="jwt-url-form__input"
            id="api-url-box"
            data-testid="jwt-api-url-input"
            onChange={(e) => {
              props.onUrlChange(e.target.value);
            }}
            value={props.apiUrl}
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
