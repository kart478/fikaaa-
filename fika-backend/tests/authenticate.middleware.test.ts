import { beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fika?schema=public';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.SESSION_SECRET = 'a-test-secret-that-is-longer-than-thirty-two-characters';
process.env.NODE_ENV = 'test';

let authenticate: typeof import('../src/middleware/authenticate.js').authenticate;
let signToken: typeof import('../src/utils/auth.js').signToken;
let COOKIE_NAME: typeof import('../src/utils/auth.js').COOKIE_NAME;

beforeAll(async () => {
  ({ authenticate } = await import('../src/middleware/authenticate.js'));
  ({ signToken, COOKIE_NAME } = await import('../src/utils/auth.js'));
});

function runMiddleware(cookies: Record<string, string>) {
  return new Promise<{ request: { auth?: { userId: string } }; error?: unknown }>((resolve) => {
    const request = { cookies } as { cookies: Record<string, string>; auth?: { userId: string } };
    authenticate(request as never, {} as never, (error?: unknown) => resolve({ request, error }));
  });
}

describe('authentication middleware', () => {
  it('rejects a protected route without a session', async () => {
    const result = await runMiddleware({});
    expect(result.error).toMatchObject({ errorCode: 'UNAUTHENTICATED' });
  });

  it('adds the authenticated user from a valid HTTP-only cookie', async () => {
    const result = await runMiddleware({ [COOKIE_NAME]: signToken('user-id') });
    expect(result.error).toBeUndefined();
    expect(result.request.auth).toEqual({ userId: 'user-id' });
  });
});
