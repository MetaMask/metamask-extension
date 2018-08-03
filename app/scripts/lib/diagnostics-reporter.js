class DiagnosticsReporter {

  constructor ({ firstTimeInfo, version }) {
    this.firstTimeInfo = firstTimeInfo
    this.version = version
  }

  async reportOrphans (orphans) {
    try {
      return await this.submit({
        accounts: Object.keys(orphans),
        metadata: {
          type: 'orphans',
        },
      })
    } catch (err) {
      console.error('DiagnosticsReporter - "reportOrphans" encountered an error:')
      console.error(err)
    }
  }

  async reportMultipleKeyrings (rawKeyrings) {
    try {
      const keyrings = await Promise.all(rawKeyrings.map(async (keyring, index) => {
        return {
          index,
          type: keyring.type,
          accounts: await keyring.getAccounts(),
        }
      }))
      return await this.submit({
        accounts: [],
        metadata: {
          type: 'keyrings',
          keyrings,
        },
      })
    } catch (err) {
      console.error('DiagnosticsReporter - "reportMultipleKeyrings" encountered an error:')
      console.error(err)
    }
  }

  async submit (message) {
    try {
      // add metadata
      message.metadata.version = this.version
      message.metadata.firstTimeInfo = this.firstTimeInfo
      return await postData(message)
    } catch (err) {
      console.error('DiagnosticsReporter - "submit" encountered an error:')
      throw err
    }
  }

}

function postData (data) {
  const uri = 'https://diagnostics.metamask.io/v1/orphanedAccounts'
  return fetch(uri, {
    body: JSON.stringify(data), // must match 'Content-Type' header
    credentials: 'same-origin', // include, same-origin, *omit
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, cors, *same-origin
  })
}

module.exports = DiagnosticsReporter
