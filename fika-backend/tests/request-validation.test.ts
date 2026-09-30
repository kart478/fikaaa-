import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/schemas/auth.schema.js';
import { createFikaSchema } from '../src/schemas/fika.schema.js';

describe('request validation', () => {
  it('normalizes email and username at registration', () => {
    const result = registerSchema.parse({ body: { name: 'Amara', username: 'AMARA_1', email: ' AMARA@EXAMPLE.COM ', password: 'strong-password' }, params: {}, query: {} });
    expect(result.body).toMatchObject({ username: 'amara_1', email: 'amara@example.com' });
  });

  it('rejects invalid login input and incomplete coordinate pairs', () => {
    expect(() => loginSchema.parse({ body: { email: 'invalid', password: '' }, params: {}, query: {} })).toThrow();
    expect(() => createFikaSchema.parse({ body: { title: 'Coffee talk', description: 'A friendly chat about interesting ideas.', type: 'COFFEE', date: '2026-08-20', startTime: '17:00', duration: 60, locationName: 'Osu', latitude: 5.5, maxParticipants: 4 }, params: {}, query: {} })).toThrow();
  });
});
