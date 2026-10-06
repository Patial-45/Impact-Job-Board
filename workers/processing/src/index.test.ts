import { describe, expect, it } from 'vitest';
import { parseRedisConnection } from './index';

describe('workers/processing - Redis Connection Parser', () => {
  it('parses standard redis URL with hostname and port', () => {
    const conn = parseRedisConnection('redis://localhost:6379');
    expect(conn.host).toBe('localhost');
    expect(conn.port).toBe(6379);
    expect(conn.tls).toBeUndefined();
  });

  it('parses authenticated rediss URL with TLS and credentials', () => {
    const conn = parseRedisConnection('rediss://user:secret@redis.example.com:6380');
    expect(conn.host).toBe('redis.example.com');
    expect(conn.port).toBe(6380);
    expect(conn.username).toBe('user');
    expect(conn.password).toBe('secret');
    expect(conn.tls).toBeDefined();
  });
});
