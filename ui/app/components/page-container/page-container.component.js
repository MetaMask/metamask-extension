import React, { Component } from 'react'
import PropTypes from 'prop-types'

import PageContainerHeader from './page-container-header'
import PageContainerFooter from './page-container-footer'

export default class PageContainer extends Component {

  static propTypes = {
    // PageContainerHeader props
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    onClose: PropTypes.func,
    showBackButton: PropTypes.bool,
    onBackButtonClick: PropTypes.func,
    backButtonStyles: PropTypes.object,
    backButtonString: PropTypes.string,
    // Content props
    ContentComponent: PropTypes.func,
    contentComponentProps: PropTypes.object,
    // PageContainerFooter props
    onCancel: PropTypes.func,
    cancelText: PropTypes.string,
    onSubmit: PropTypes.func,
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
  };

  render () {
    const {
      title,
      subtitle,
      onClose,
      showBackButton,
      onBackButtonClick,
      backButtonStyles,
      backButtonString,
      ContentComponent,
      contentComponentProps,
      onCancel,
      cancelText,
      onSubmit,
      submitText,
      disabled,
    } = this.props

    return (
      <div className="page-container">
        <PageContainerHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
          showBackButton={showBackButton}
          onBackButtonClick={onBackButtonClick}
          backButtonStyles={backButtonStyles}
          backButtonString={backButtonString}
        />
        <div className="page-container__content">
          <ContentComponent { ...contentComponentProps } />
        </div>
        <PageContainerFooter
          onCancel={onCancel}
          cancelText={cancelText}
          onSubmit={onSubmit}
          submitText={submitText}
          disabled={disabled}
        />
      </div>
    )
  }

}
