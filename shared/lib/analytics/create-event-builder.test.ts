import { createEventBuilder } from './create-event-builder';

describe('createEventBuilder', () => {
  it('creates an event from a string event name', () => {
    const event = createEventBuilder('Test Event').build();

    expect(event).toStrictEqual({
      name: 'Test Event',
      properties: {},
      sensitiveProperties: {},
    });
  });

  it('sets category on the event properties', () => {
    const event = createEventBuilder('Test Event')
      .addCategory('Settings')
      .build();

    expect(event.properties).toStrictEqual({
      category: 'Settings',
    });
  });

  it('adds, merges, overwrites, and removes properties', () => {
    const event = createEventBuilder('Test Event')
      .addProperties({ foo: 'bar', removeMe: 'value' })
      .addProperties({ foo: 'baz', answer: 42, omitMe: undefined })
      .removeProperties(['removeMe'])
      .build();

    expect(event.properties).toStrictEqual({
      foo: 'baz',
      answer: 42,
    });
  });

  it('adds, merges, overwrites, and removes sensitive properties', () => {
    const event = createEventBuilder('Test Event')
      .addSensitiveProperties({ secret: 'first', removeMe: true })
      .addSensitiveProperties({ secret: 'second', omitMe: undefined })
      .removeSensitiveProperties(['removeMe'])
      .build();

    expect(event.sensitiveProperties).toStrictEqual({
      secret: 'second',
    });
  });

  it('includes build options when provided', () => {
    const event = createEventBuilder('Test Event').build({
      excludeMetaMetricsId: true,
      environmentType: 'notification',
    });

    expect(event.options).toStrictEqual({
      excludeMetaMetricsId: true,
      environmentType: 'notification',
    });
  });

  it('throws when no event name is provided', () => {
    expect(() => createEventBuilder('')).toThrow(
      'Must specify event. Event was: ',
    );
  });
});
