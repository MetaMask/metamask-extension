import React from 'react'
import HomeNotification from './home-notification.component'

export default {
  title: 'HomeNotification',
}

export const Standard = () => (
  <HomeNotification
    acceptText="Accept"
    onAccept={() => {}}
    onIgnore={() => {}}
    ignoreText="Reject"
    descriptionText="This is some description text."
    infoText="This is some info text"
  />
)

