import React from 'react'
import SvgIcon from '../../../ui/svg-icon'

export default function BackIcon (props) {
  return (
    <SvgIcon
      {...props}
      svg={(
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.0625 11.5C7.78125 11.7812 7.78125 12.25 8.0625 12.5312L14.125 18.625C14.4375 18.9062 14.9062 18.9062 15.1875 18.625L15.9062 17.9062C16.1875 17.625 16.1875 17.1562 15.9062 16.8438L11.0938 12L15.9062 7.1875C16.1875 6.875 16.1875 6.40625 15.9062 6.125L15.1875 5.40625C14.9062 5.125 14.4375 5.125 14.125 5.40625L8.0625 11.5Z"
            fill="#6A737D"
          />
        </svg>
      )}
    />
  )
}
