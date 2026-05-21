export const formatDate = (iso, { withYear = true } = {}) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
};

// JS Date.getDay() retorna 0=domingo; Python weekday() retorna 0=segunda.
// O backend usa o padrão Python — convertemos pra match.
export const getLocalPythonWeekday = () => (new Date().getDay() + 6) % 7;

export const DAY_NAMES = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];
