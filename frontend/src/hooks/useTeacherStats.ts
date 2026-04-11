'use client';
import useSWR from 'swr';
import { statsApi, TeacherStats } from '@/lib/api/statsApi';

const fetcher = () => statsApi.get().then((r) => r.data);

export function useTeacherStats() {
  const { data, error, isLoading, mutate } = useSWR<TeacherStats>(
    '/api/teacher/stats',
    fetcher,
    {
      refreshInterval: 30_000,   // poll every 30s for live data
      revalidateOnFocus: true,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
