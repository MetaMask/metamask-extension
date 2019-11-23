import React from 'react'
const PropTypes = require('prop-types')

function SeedImportSubview (_, { t }) {
  return (
    <div>
      {t('pasteSeed')}
      <textarea />
      <br />
      <button>{t('submit')}</button>
    </div>
  )
}

SeedImportSubview.contextTypes = {
  t: PropTypes.func,
}

module.exports = SeedImportSubview
