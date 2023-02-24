import React, { Component } from 'react';
import PropTypes from 'prop-types';
import JwtDropdown from '../jwt-dropdown/jwt-dropdown';
import DragAndDrop from '../../../../components/ui/drag-and-drop';
import Button from '../../../../components/ui/button';

// As a JWT is included in a HTTP header, we've an upper limit (SO: Maximum on http header values) of
// 8K on the majority of current servers, with 7kb giving a reasonable amount of room for other headers
const MAX_JWT_SIZE = 7000;

export default class JwtUrlForm extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    jwtList: PropTypes.array,
    currentJwt: PropTypes.string,
    onJwtChange: PropTypes.func,
    jwtInputText: PropTypes.string,
    apiUrl: PropTypes.string,
    urlInputText: PropTypes.string,
    onUrlChange: PropTypes.func,
  };

  state = {
    addNewTokenClicked: false,
  };

  renderJWTInput() {
    const showAddNewToken = this.state.addNewTokenClicked;
    const showJwtDropdown = this.props.jwtList.length >= 1;
    const { fileTooBigError } = this.state;

    return (
      <div className="jwt-url-form__jwt-container">
        {showJwtDropdown && (
          <JwtDropdown
            data-testid="jwt-dropdown"
            currentJwt={
              this.props.currentJwt
                ? this.props.currentJwt
                : this.props.jwtList[0]
            }
            jwtList={this.props.jwtList}
            onChange={(value) => {
              this.props.onJwtChange(value);
              this.setState({ fileTooBigError: false });
            }}
          />
        )}
        {showJwtDropdown && !showAddNewToken && (
          <div className="jwt-url-form__btn__container">
            <span>or</span>
            <Button
              type="secondary"
              medium="true"
              onClick={() => {
                this.props.onJwtChange('');
                this.setState({ addNewTokenClicked: true });
              }}
            >
              Add new token
            </Button>
          </div>
        )}
        {(!showJwtDropdown || showAddNewToken) && (
          <div>
            <span className="jwt-url-form__instruction">
              {this.props.jwtInputText}
            </span>
            {fileTooBigError && (
              <span className="error">The dropped file is too big.</span>
            )}
            <DragAndDrop
              className="jwt-url-form__input-jwt-container"
              handleDrop={(files) => {
                if (files[0].size > MAX_JWT_SIZE) {
                  this.setState({ fileTooBigError: true });
                  return;
                }
                // eslint-disable-next-line no-undef
                const reader = new FileReader();
                reader.onload = (event) => {
                  this.props.onJwtChange(event.target.result);
                  this.setState({
                    fileTooBigError: false,
                  });
                };
                reader.readAsText(files[0]);
              }}
            >
              <textarea
                className="jwt-url-form__input-jwt"
                id="jwt-box"
                onChange={(e) => {
                  this.props.onJwtChange(e.target.value);
                  this.setState({
                    fileTooBigError: false,
                  });
                }}
                ref={this.inputRef}
                value={this.props.currentJwt}
                autoFocus
              />
            </DragAndDrop>
          </div>
        )}
      </div>
    );
  }

  renderAPIURLInput() {
    return (
      <div className="jwt-url-form__jwt-apiUrlInput">
        <span className="jwt-url-form__instruction">
          {this.props.urlInputText}
        </span>
        <div>
          <input
            className="jwt-url-form__input"
            id="api-url-box"
            data-testid="jwt-api-url-input"
            onChange={(e) => {
              this.props.onUrlChange(e.target.value);
            }}
            value={this.props.apiUrl}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="jwt-url-form">
        {this.renderJWTInput()}
        {this.renderAPIURLInput()}
      </div>
    );
  }
}
