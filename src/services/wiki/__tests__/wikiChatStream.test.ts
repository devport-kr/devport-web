/**
 * Unit tests for parseSSEMessage — the SSE event parser extracted from wikiChatStream.ts.
 */

import { describe, expect, it, vi } from 'vitest';
import { parseSSEMessage } from '../wikiChatStream';
import type { StreamCallbacks } from '../wikiChatStream';

function makeCallbacks(): StreamCallbacks & {
    _tokens: string[];
    _done: Parameters<StreamCallbacks['onDone']>[0][];
    _errors: string[];
} {
    const _tokens: string[] = [];
    const _done: Parameters<StreamCallbacks['onDone']>[0][] = [];
    const _errors: string[] = [];

    return {
        _tokens,
        _done,
        _errors,
        onToken: (token) => _tokens.push(token),
        onDone: (payload) => _done.push(payload),
        onError: (msg) => _errors.push(msg),
    };
}

describe('parseSSEMessage', () => {
    it('dispatches token event to onToken and preserves leading spaces', () => {
        const cbs = makeCallbacks();
        parseSSEMessage('event: token\ndata: 안녕하세요', cbs);
        expect(cbs._tokens).toEqual(['안녕하세요']);

        // "data:  SecurityConfig에서" — one delimiter space + one payload space
        parseSSEMessage('event: token\ndata:  SecurityConfig에서', cbs);
        expect(cbs._tokens[1]).toBe(' SecurityConfig에서');

        expect(cbs._done).toHaveLength(0);
        expect(cbs._errors).toHaveLength(0);
    });

    it('parses JSON string tokens to preserve whitespace and newlines', () => {
        const cbs = makeCallbacks();
        // Backend JSON encoded: "\" 줄바꿈\\n테스트 \""
        parseSSEMessage('event: token\ndata: " 줄바꿈\\n테스트 "', cbs);
        expect(cbs._tokens).toEqual([' 줄바꿈\n테스트 ']);
    });

    it('ignores empty token data', () => {
        const cbs = makeCallbacks();
        parseSSEMessage('event: token\ndata: ', cbs);
        expect(cbs._tokens).toHaveLength(0);
    });

    it('dispatches done event with parsed payload', () => {
        const payload = {
            sessionId: 'abc-123',
            isClarification: false,
            clarificationOptions: [],
            suggestedNextQuestions: ['JWT 흐름을 설명해줘'],
            sessionReset: false,
        };
        const cbs = makeCallbacks();
        parseSSEMessage(`event: done\ndata: ${JSON.stringify(payload)}`, cbs);
        expect(cbs._done).toHaveLength(1);
        expect(cbs._done[0]).toEqual(payload);
        expect(cbs._tokens).toHaveLength(0);
        expect(cbs._errors).toHaveLength(0);
    });

    it('calls onError when done data is not valid JSON', () => {
        const cbs = makeCallbacks();
        parseSSEMessage('event: done\ndata: not-json', cbs);
        expect(cbs._errors).toHaveLength(1);
        expect(cbs._errors[0]).toContain('파싱');
    });

    it('dispatches error event with message', () => {
        const cbs = makeCallbacks();
        parseSSEMessage('event: error\ndata: {"message":"처리 중 오류가 발생했습니다."}', cbs);
        expect(cbs._errors).toEqual(['처리 중 오류가 발생했습니다.']);
        expect(cbs._tokens).toHaveLength(0);
    });

    it('falls back to default error message when error data is bad JSON', () => {
        const cbs = makeCallbacks();
        parseSSEMessage('event: error\ndata: !!!', cbs);
        expect(cbs._errors).toHaveLength(1);
    });

    it('ignores unknown event names', () => {
        const cbs = makeCallbacks();
        parseSSEMessage('event: heartbeat\ndata: ping', cbs);
        expect(cbs._tokens).toHaveLength(0);
        expect(cbs._done).toHaveLength(0);
        expect(cbs._errors).toHaveLength(0);
    });

    it('does nothing when data line is absent', () => {
        const cbs = makeCallbacks();
        parseSSEMessage('event: token', cbs);
        expect(cbs._tokens).toHaveLength(0);
    });

    it('handles missing onToken for empty string data', () => {
        const onToken = vi.fn();
        const cbs: StreamCallbacks = {
            onToken,
            onDone: vi.fn(),
            onError: vi.fn(),
        };
        // empty data — parseSSEMessage returns early before switch
        parseSSEMessage('event: token\ndata:', cbs);
        expect(onToken).not.toHaveBeenCalled();
    });
});
