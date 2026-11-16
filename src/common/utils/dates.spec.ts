import { endOfUtcDay } from './dates';

describe('endOfUtcDay', () => {
  it('stores a calendar date at the end of that UTC day', () => {
    const date = endOfUtcDay('2026-11-16');
    expect(date.toISOString()).toBe('2026-11-16T23:59:59.999Z');
  });

  it('rejects an impossible calendar date', () => {
    expect(() => endOfUtcDay('2026-02-31')).toThrow(
      'dueDate must be a calendar date',
    );
  });
});
