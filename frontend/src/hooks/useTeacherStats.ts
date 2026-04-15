'use client';
import useSWR from 'swr';
import { statsApi, TeacherStats } from '@/lib/api/statsApi';

const fetcher = () => statsApi.get().then((r) => r.data);

export function useTeacherStats() {
  const { data, error, isLoading, mutate } = useSWR<TeacherStats>(
    '/api/teacher/stats',
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // ✅ poll every 5 minutes
      revalidateOnFocus: false,        // ✅ don't refetch on tab focus
      revalidateOnReconnect: false,    // ✅ don't refetch on reconnect
      dedupingInterval: 60_000,        // ✅ cache for 1 minute
    }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}