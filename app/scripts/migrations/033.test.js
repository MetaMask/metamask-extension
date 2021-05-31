import { strict as assert } from 'assert';
import migration33 from './033';

describe('Migration to delete notice controller', function () {
  const oldStorage = {
    meta: {},
    data: {
      NoticeController: {
        noticesList: [
          {
            id: 0,
            read: false,
            date: 'Thu Feb 09 2017',
            title: 'Terms of Use',
            body: 'notice body',
          },
          {
            id: 2,
            read: false,
            title: 'Privacy Notice',
            body: 'notice body',
          },
          {
            id: 4,
            read: false,
            title: 'Phishing Warning',
            body: 'notice body',
          },
        ],
      },
    },
  };

  it('removes notice controller from state', function () {
    migration33.migrate(oldStorage).then((newStorage) => {
      assert.equal(newStorage.data.NoticeController, undefined);
    });
  });
});
