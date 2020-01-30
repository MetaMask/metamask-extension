const assert = require('assert')
const migration37 = require('../../../app/scripts/migrations/037')

describe('migration #37', () => {
  it('should update the version metadata', (done) => {
    const oldStorage = {
      'meta': {
        'version': 36,
      },
      'data': {},
    }

    migration37.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          'version': 37,
        })
        done()
      })
      .catch(done)
  })

  it('should transform old state to new format', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'AddressBookController': {
          'addressBook': {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
              chainId: '4',
              memo: '',
              name: 'account 3',
            },
            '0x32Be343B94f860124dC4fEe278FDCBD38C102D88': {
              address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
              chainId: '4',
              memo: '',
              name: 'account 2',
            },
            // there are no repeated addresses by the current implementation
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA93': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA93',
              chainId: '2',
              memo: '',
              name: 'account 2',
            },
          },
        },
      },
    }

    migration37.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.AddressBookController.addressBook, {
          '4': {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
              chainId: '4',
              isEns: false,
              memo: '',
              name: 'account 3',
            },
            '0x32Be343B94f860124dC4fEe278FDCBD38C102D88': {
              address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
              chainId: '4',
              isEns: false,
              memo: '',
              name: 'account 2',
            },
          },
          '2': {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA93': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA93',
              chainId: '2',
              isEns: false,
              memo: '',
              name: 'account 2',
            },
          },
        })
        done()
      })
      .catch(done)
  })

  it('ens validation test', (done) => {
    const oldStorage = {
      'meta': {},
      'data': {
        'AddressBookController': {
          'addressBook': {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
              chainId: '4',
              memo: '',
              name: 'metamask.eth',
            },
          },
        },
      },
    }

    migration37.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data.AddressBookController.addressBook, {
          '4': {
            '0x1De7e54679bfF0c23856FbF547b2394e723FCA91': {
              address: '0x1De7e54679bfF0c23856FbF547b2394e723FCA91',
              chainId: '4',
              isEns: true,
              memo: '',
              name: 'metamask.eth',
            },
          },
        })
        done()
      })
      .catch(done)
  })
})
