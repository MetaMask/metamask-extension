import React from 'react'
import CaretDropdownWithButtons from '.'

export default {
  title: 'CaretDropdownWithButtons',
}

export const Default = () => (
  <div style={{ height: '200px', marginTop: '160px' }}>
    <CaretDropdownWithButtons
      toggleText="Example"
      prefixText="Prefix"
    />
  </div>
)
