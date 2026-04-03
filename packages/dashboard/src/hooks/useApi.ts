import useSWR from "swr";
import { fetchApi } from "../lib/api";

export function useApi<T>(path: string | null) {
  const { data, error, isLoading, mutate } = useSWR(path, fetchApi<T>, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 3000,
  });
  return { data, error, isLoading, mutate };
}
