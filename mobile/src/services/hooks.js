import { useCallback, useEffect, useRef, useState } from "react";
import api from "./api";
import { MUSCLE_GROUPS } from "./constants";

const useFetch = (fetcher, deps) => {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
};

const fetchAll = async (initialUrl) => {
  const items = [];
  let url = initialUrl;
  while (url) {
    const response = await api.get(url);
    items.push(...response.data.results);
    url = response.data.next;
  }
  return items;
};

export const useExercises = ({ muscleGroup } = {}) => {
  return useFetch(async () => {
    const params = muscleGroup ? `?muscle_group=${muscleGroup}` : "";
    return fetchAll(`/exercises/${params}`);
  }, [muscleGroup]);
};

export const useExerciseDetail = (id) => {
  return useFetch(async () => {
    const response = await api.get(`/exercises/${id}/`);
    return response.data;
  }, [id]);
};

export const useExerciseHistory = (id) => {
  return useFetch(async () => fetchAll(`/exercises/${id}/history/`), [id]);
};

export const useExerciseProgression = (id) => {
  return useFetch(async () => {
    const response = await api.get(`/exercises/${id}/progression/`);
    return response.data;
  }, [id]);
};

export const useProgressPhotos = () => {
  return useFetch(async () => fetchAll(`/users/me/progress-photos/`), []);
};

export const useMuscleGroupCounts = () => {
  return useFetch(async () => {
    const results = await Promise.all(
      MUSCLE_GROUPS.map(async (g) => {
        const response = await api.get(`/exercises/?muscle_group=${g.key}`);
        return [g.key, response.data.count ?? 0];
      })
    );
    return Object.fromEntries(results);
  }, []);
};
