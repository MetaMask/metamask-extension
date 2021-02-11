import React from 'react'
import CircleIcon from './circle-icon.component'

export default {
  title: 'CircleIcon',
}

export const basicCircleIcon = () => (
  <CircleIcon
    border="1px solid"
    borderColor="black"
    background="white"
    iconSize="42px"
    iconSource="images/celo_logo.svg"
  />
)
