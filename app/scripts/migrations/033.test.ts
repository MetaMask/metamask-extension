import migration33 from './033';

type MigrationInput = Parameters<typeof migration33.migrate>[0];

describe('Migration to delete notice controller', () => {
  const oldStorage: MigrationInput = {
    meta: { version: 32 },
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

  it('removes notice controller from state', async () => {
    const newStorage = await migration33.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data.NoticeController).toBeUndefined();
  });
});
