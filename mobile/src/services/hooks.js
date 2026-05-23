import { useCallback, useEffect, useRef, useState } from "react";
import api from "./api";
import { MUSCLE_GROUPS } from "./constants";
import { getLocalPythonWeekday } from "./format";

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

export const useExerciseVolumeTrend = (id, sessions = 10) => {
  return useFetch(async () => {
    const response = await api.get(
      `/exercises/${id}/volume-trend/?sessions=${sessions}`
    );
    return response.data;
  }, [id, sessions]);
};

export const useActivityStats = (days = 30) => {
  return useFetch(async () => {
    const response = await api.get(
      `/workouts/sessions/activity-stats/?days=${days}`
    );
    return response.data;
  }, [days]);
};

export const useProgressPhotos = () => {
  return useFetch(async () => fetchAll(`/users/me/progress-photos/`), []);
};

export const useTemplates = () => {
  return useFetch(async () => fetchAll(`/workouts/templates/`), []);
};

export const useTemplateDetail = (id) => {
  return useFetch(async () => {
    const response = await api.get(`/workouts/templates/${id}/`);
    return response.data;
  }, [id]);
};

export const createTemplate = async (payload) => {
  const response = await api.post("/workouts/templates/", payload);
  return response.data;
};

export const updateTemplate = async (id, payload) => {
  const response = await api.put(`/workouts/templates/${id}/`, payload);
  return response.data;
};

export const deleteTemplate = async (id) => {
  await api.delete(`/workouts/templates/${id}/`);
};

export const useScheduledToday = () => {
  return useFetch(async () => {
    const dow = getLocalPythonWeekday();
    const response = await api.get(
      `/workouts/scheduled-workouts/?day_of_week=${dow}`
    );
    return response.data.results;
  }, []);
};

export const useScheduledWeek = () => {
  return useFetch(async () => fetchAll(`/workouts/scheduled-workouts/`), []);
};

export const createSchedule = async (payload) => {
  const response = await api.post("/workouts/scheduled-workouts/", payload);
  return response.data;
};

export const deleteSchedule = async (id) => {
  await api.delete(`/workouts/scheduled-workouts/${id}/`);
};

export const createWorkoutSession = async (payload) => {
  const response = await api.post("/workouts/sessions/", payload);
  return response.data;
};

export const uploadProgressPhoto = async ({ uri, takenAt, notes }) => {
  const form = new FormData();
  form.append("image", { uri, type: "image/jpeg", name: "photo.jpg" });
  if (takenAt) form.append("taken_at", takenAt);
  if (notes) form.append("notes", notes);
  const response = await api.post("/users/me/progress-photos/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
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
