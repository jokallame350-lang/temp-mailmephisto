import { describe, expect, it } from 'vitest';
import { extractActionLinks } from '../actionLinks';

describe('extractActionLinks', () => {
  it('accepts explicit HTTPS verification links', () => {
    const result = extractActionLinks('<a href="https://example.com/verify?token=abc">Verify your email</a>');
    expect(result?.url).toBe('https://example.com/verify?token=abc');
  });

  it('rejects non-HTTPS and local destinations', () => {
    expect(extractActionLinks('<a href="javascript:alert(1)">Verify your email</a>')).toBeNull();
    expect(extractActionLinks('<a href="http://example.com/verify">Verify your email</a>')).toBeNull();
    expect(extractActionLinks('<a href="https://127.0.0.1/verify">Verify your email</a>')).toBeNull();
  });

  it('does not treat unrelated action links as verification links', () => {
    expect(extractActionLinks('<a href="https://example.com/login">Log in</a>')).toBeNull();
    expect(extractActionLinks('<a href="https://example.com/reset">Reset password</a>')).toBeNull();
  });
});
