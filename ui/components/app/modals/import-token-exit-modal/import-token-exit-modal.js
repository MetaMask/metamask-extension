import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from '../../../../store/actions';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import {
  Text,
  ButtonSecondary,
  ButtonPrimary,
  Box,
} from '../../../component-library';
import {
  TextAlign,
  FontWeight,
  TextVariant,
  Size,
} from '../../../../helpers/constants/design-system';

function mapStateToProps(state) {
  return {
    history: state.appState.modal.modalState.props.history,
  };
}

function later(delay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    forceHideModal: () => {
      later(0).then(() => {
        dispatch(actions.clearPendingTokens());
        dispatch(actions.hideModal());
      });
    },
  };
}

class ImportTokensExitModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    forceHideModal: PropTypes.func.isRequired,
    history: PropTypes.object,
  };

  state = {};

  render() {
    const { hideModal, history, forceHideModal } = this.props;

    return (
      <div className="exit-token-confirmation">
        <div className="exit-token-confirmation__container">
          <Text
            textAlign={TextAlign.Center}
            fontWeight={FontWeight.Bold}
            variant={TextVariant.bodyMd}
          >
            {this.context.t('importExitHeader')}
          </Text>
          <Box marginTop={5} className="exit-token-confirmation__title">
            {this.context.t('importExitConfirmation')}
          </Box>

          <div className="exit-token-confirmation__buttons">
            <ButtonSecondary
              data-testid="exit-token-confirmation__back"
              size={Size.LG}
              onClick={() => hideModal()}
              block
            >
              {this.context.t('back')}
            </ButtonSecondary>
            <ButtonPrimary
              size={Size.LG}
              data-testid="exit-token-confirmation__confirm"
              onClick={() => {
                forceHideModal();
                history.push(DEFAULT_ROUTE);
              }}
              block
            >
              {this.context.t('confirm')}
            </ButtonPrimary>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ImportTokensExitModal);
