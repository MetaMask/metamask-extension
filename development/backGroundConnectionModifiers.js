module.exports = {
  'confirm sig requests': {
    signMessage: (_, cb) => {
      const stateUpdate = {
        unapprovedMsgs: {},
        unapprovedMsgCount: 0,
      }
      return cb(null, stateUpdate)
    },
    signPersonalMessage: (_, cb) => {
      const stateUpdate = {
        unapprovedPersonalMsgs: {},
        unapprovedPersonalMsgCount: 0,
      }
      return cb(null, stateUpdate)
    },
    signTypedMessage: (_, cb) => {
      const stateUpdate = {
        unapprovedTypedMessages: {},
        unapprovedTypedMessagesCount: 0,
      }
      return cb(null, stateUpdate)
    },
  },
}

