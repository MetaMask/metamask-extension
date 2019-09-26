function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

function loadFromMock3Box (key) {
  return new Promise(async (resolve) => {
    const res = await fetch('http://localhost:8889?key=' + key)
    const text = await res.text()
    resolve(text.length ? JSON.parse(text) : null)
  })
}

function saveToMock3Box (key, newDataAtKey) {
  return new Promise(async (resolve) => {
    const res = await fetch('http://localhost:8889', {
      method: 'POST',
      body: JSON.stringify({
        key,
        data: newDataAtKey,
      }),
    })

    resolve(res.text())
  })
}

class Mock3Box {
  static openBox (address) {
    this.address = address
    return Promise.resolve({
      onSyncDone: cb => { setTimeout(cb, 200) },
      openSpace: async (spaceName, config) => {
        const { onSyncDone } = config
        this.spaceName = spaceName

        setTimeout(onSyncDone, 150)

        await delay(50)

        return {
          private: {
            get: async (key) => {
              await delay(50)
              const res = await loadFromMock3Box(`${this.address}-${this.spaceName}-${key}`)
              return res
            },
            set: async (key, data) => {
              await saveToMock3Box(`${this.address}-${this.spaceName}-${key}`, data)
              await delay(50)
              return null
            },
          },
        }
      },
      logout: () => {},
    })
  }

  static async getConfig (address) {
    const backup = await loadFromMock3Box(`${address}-metamask-metamaskBackup`)
    return backup
      ? { spaces: { metamask: {} } }
      : {}
  }
}

module.exports = Mock3Box
