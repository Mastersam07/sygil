import useSWR from "swr";
import { fetchApi } from "../lib/api";

export function useApi<T>(path: string | null) {
  const { data, error, isLoading, mutate } = useSWR(path, fetchApi<T>, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
  });
  return { data, error, isLoading, mutate };
}
