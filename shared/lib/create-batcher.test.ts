import { create } from './create-batcher';

describe('create', () => {
  it('batches concurrent fetches and resolves each caller', async () => {
    const fetcher = jest.fn(async (ids: number[]) =>
      ids.map((id) => ({ id, label: `item-${id}` })),
    );

    const batcher = create({
      fetcher,
      resolver: (results, id) => results.find((result) => result.id === id),
    });

    const [first, second] = await Promise.all([
      batcher.fetch(1),
      batcher.fetch(2),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith([1, 2]);
    expect(first).toEqual({ id: 1, label: 'item-1' });
    expect(second).toEqual({ id: 2, label: 'item-2' });
  });

  it('deduplicates items before calling the fetcher', async () => {
    const fetcher = jest.fn(async (ids: number[]) =>
      ids.map((id) => ({ id, label: `item-${id}` })),
    );

    const batcher = create({
      fetcher,
      resolver: (results, id) => results.find((result) => result.id === id),
    });

    await Promise.all([batcher.fetch(1), batcher.fetch(1)]);

    expect(fetcher).toHaveBeenCalledWith([1]);
  });

  it('resolves undefined when the resolver finds no match', async () => {
    const fetcher = jest.fn(async () => [{ id: 1, label: 'item-1' }]);

    const batcher = create({
      fetcher,
      resolver: (results, id) => results.find((result) => result.id === id),
    });

    await expect(batcher.fetch(2)).resolves.toBeUndefined();
  });
});
