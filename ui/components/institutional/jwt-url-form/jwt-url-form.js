import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  DISPLAY,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';
import JwtDropdown from '../jwt-dropdown';
import DragAndDrop from '../drag-and-drop';
import Button from '../../ui/button';
import Box from '../../ui/box';

// As a JWT is included in a HTTP header, we've an upper limit (SO: Maximum on http header values) of
// 8K on the majority of current servers, with 7kb giving a reasonable amount of room for other headers
const MAX_JWT_SIZE = 7000;

const JwtUrlForm = (props) => {
  const t = useI18nContext();
  const inputRef = useRef();
  const [addNewTokenClicked, setAddNewTokenClicked] = useState(false);
  const [fileTooBigError, setFileTooBigError] = useState();

  const renderJWTInput = () => {
    const showAddNewToken = addNewTokenClicked;
    const showJwtDropdown = props.jwtList.length >= 1;

    return (
      <Box className="jwt-url-form__jwt-container" marginBottom={6}>
        {showJwtDropdown && (
          <JwtDropdown
            data-testid="jwt-dropdown"
            currentJwt={props.currentJwt ? props.currentJwt : props.jwtList[0]}
            jwtList={props.jwtList}
            onChange={(value) => {
              props.onJwtChange(value);
              setFileTooBigError(false);
            }}
          />
        )}
        {showJwtDropdown && !showAddNewToken && (
          <Box
            className="jwt-url-form__btn__container"
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            marginTop={2}
          >
            <Text>{t('or')}</Text>
            <Button
              type="secondary"
              medium="true"
              onClick={() => {
                props.onJwtChange('');
                setAddNewTokenClicked(true);
              }}
            >
              <Text>{t('addNewToken')}</Text>
            </Button>
          </Box>
        )}
        {(!showJwtDropdown || showAddNewToken) && (
          <Box>
            <Text className="jwt-url-form__instruction">
              {props.jwtInputText}
            </Text>
            {fileTooBigError && (
              <span className="error">
                <Text>{t('fileTooBig')}</Text>
              </span>
            )}
            <DragAndDrop
              className="jwt-url-form__input-jwt-container"
              handleDrop={(files) => {
                if (files[0].size > MAX_JWT_SIZE) {
                  setFileTooBigError(true);
                  return;
                }
                // eslint-disable-next-line no-undef
                const reader = new FileReader();

                reader.onload = (event) => {
                  props.onJwtChange(event.target.result);
                  setFileTooBigError(false);
                };

                reader.readAsText(files[0]);
              }}
            >
              <textarea
                className="jwt-url-form__input-jwt"
                borderColor={BorderColor.borderDefault}
                id="jwt-box"
                onChange={(e) => {
                  props.onJwtChange(e.target.value);
                  setFileTooBigError(false);
                }}
                ref={inputRef.current}
                value={props.currentJwt}
                autoFocus
              />
            </DragAndDrop>
          </Box>
        )}
      </Box>
    );
  };

  const renderAPIURLInput = () => {
    return (
      <Box className="jwt-url-form__jwt-apiUrlInput">
        <Text className="jwt-url-form__instruction">{props.urlInputText}</Text>
        <Box>
          <input
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
    );
  };

  return (
    <Box
      className="jwt-url-form"
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexStart}
      marginBottom={8}
    >
      {renderJWTInput()}
      {renderAPIURLInput()}
    </Box>
  );
};

JwtUrlForm.propTypes = {
  jwtList: PropTypes.array,
  currentJwt: PropTypes.string,
  onJwtChange: PropTypes.func,
  jwtInputText: PropTypes.string,
  apiUrl: PropTypes.string,
  urlInputText: PropTypes.string,
  onUrlChange: PropTypes.func,
};

export default JwtUrlForm;
