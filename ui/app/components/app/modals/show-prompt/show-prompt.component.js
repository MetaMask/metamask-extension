import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ShowPrompt extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    rejectPrompt: PropTypes.func.isRequired,
    resolvePrompt: PropTypes.func.isRequired,
    prompt: PropTypes.object.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    value: '',
  }

  handleSubmit = () => {
    this.props.resolvePrompt(this.props.prompt.id, this.state.value)
    this.props.hideModal()
  }

  handleInput = (event) => {
    this.setState({ value: event.target.value })
  }

  promptIframe = (content) => {
    return <iframe
      title="title"
      srcDoc={ content }
    />
  }


  render () {
    const { t } = this.context
    const {
      rejectPrompt,
      hideModal,
      prompt,
    } = this.props

    return (
      <Modal
        onSubmit={this.handleSubmit}
        onCancel={() => {
          rejectPrompt(prompt.id)
          hideModal()
        }}
        submitText={t('confirm')}
        cancelText={t('cancel')}
        submitType="secondary"
      >
        <div>
          <ModalContent
            title={prompt.title}
            description={prompt.message}
            ContentSubComponent={this.promptIframe(prompt.html)}
          />
          <input
            type="text"
            className="add-to-address-book-modal__input"
            placeholder={t('addToAddressBookModalPlaceholder')}
            onChange={this.handleInput}
            value={this.state.value}
            autoFocus
          />
        </div>
      </Modal>
    )
  }
}
