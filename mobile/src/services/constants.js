// Troque para o IP da sua máquina na LAN quando rodar no celular físico
// via Expo Go. Exemplo: "http://192.168.0.10:8000/api"
// Em emulador Android use "http://10.0.2.2:8000/api"
export const API_BASE_URL = "http://172.31.222.101:8000/api";

export const SECURE_STORE_KEYS = {
  ACCESS: "auth_access_token",
  REFRESH: "auth_refresh_token",
};

export const MUSCLE_GROUPS = [
  { key: "chest", label: "Peito", icon: "body-outline", color: "#ef4444" },
  { key: "back", label: "Costas", icon: "body-outline", color: "#f59e0b" },
  { key: "shoulders", label: "Ombros", icon: "barbell-outline", color: "#eab308" },
  { key: "biceps", label: "Bíceps", icon: "fitness-outline", color: "#10b981" },
  { key: "triceps", label: "Tríceps", icon: "fitness-outline", color: "#06b6d4" },
  { key: "legs", label: "Pernas", icon: "walk-outline", color: "#3b82f6" },
  { key: "glutes", label: "Glúteos", icon: "walk-outline", color: "#8b5cf6" },
  { key: "core", label: "Core", icon: "body-outline", color: "#ec4899" },
  { key: "cardio", label: "Cardio", icon: "heart-outline", color: "#dc2626" },
  { key: "full_body", label: "Corpo Inteiro", icon: "body-outline", color: "#6366f1" },
];

export const MUSCLE_GROUP_LABELS = MUSCLE_GROUPS.reduce((acc, g) => {
  acc[g.key] = g.label;
  return acc;
}, {});
