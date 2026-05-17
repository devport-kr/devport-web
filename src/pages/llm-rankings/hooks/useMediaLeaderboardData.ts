import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LLMMediaType } from '../../../services/llm/llmService';
import { getLLMMediaLeaderboard } from '../../../services/llm/llmService';
import { createEmptyMediaLeaderboards, mediaTypeConfig } from '../types';
import type { MediaLeaderboardState } from '../types';

export function useMediaLeaderboardData() {
  const mediaTypeKeys = useMemo(() => Object.keys(mediaTypeConfig) as LLMMediaType[], []);
  const fetchedMediaRef = useRef<Record<string, boolean>>({});

  const [mediaLeaderboards, setMediaLeaderboards] = useState<Record<LLMMediaType, MediaLeaderboardState>>(
    createEmptyMediaLeaderboards()
  );

  const fetchMediaLeaderboard = useCallback(async (mediaType: LLMMediaType) => {
    setMediaLeaderboards((prev) => ({
      ...prev,
      [mediaType]: {
        ...prev[mediaType],
        loading: true,
        error: null,
      },
    }));

    try {
      const data = await getLLMMediaLeaderboard(mediaType, 0, 10, 'rank,asc');
      setMediaLeaderboards((prev) => ({
        ...prev,
        [mediaType]: {
          ...prev[mediaType],
          items: data.content,
          page: data.number,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
          last: data.last,
          loading: false,
          initialized: true,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch media leaderboard:', error);
      setMediaLeaderboards((prev) => ({
        ...prev,
        [mediaType]: {
          ...prev[mediaType],
          loading: false,
          error: '랭킹 데이터를 불러오지 못했습니다.',
          initialized: true,
        },
      }));
    }
  }, []);

  useEffect(() => {
    mediaTypeKeys.forEach((mediaType) => {
      if (fetchedMediaRef.current[mediaType]) return;
      fetchedMediaRef.current[mediaType] = true;
      fetchMediaLeaderboard(mediaType);
    });
  }, [mediaTypeKeys, fetchMediaLeaderboard]);

  const mediaAggregate = useMemo(() => {
    let total = 0;
    let initializedCount = 0;

    mediaTypeKeys.forEach((mediaType) => {
      const state = mediaLeaderboards[mediaType];
      if (state?.initialized) {
        initializedCount += 1;
        total += state.totalElements;
      }
    });

    return {
      total,
      ready: initializedCount === mediaTypeKeys.length,
    };
  }, [mediaLeaderboards, mediaTypeKeys]);

  const resetMediaState = useCallback(() => {
    setMediaLeaderboards(createEmptyMediaLeaderboards());
    fetchedMediaRef.current = {};
  }, []);

  return {
    mediaTypeKeys,
    mediaLeaderboards,
    mediaAggregate,
    resetMediaState,
  };
}
