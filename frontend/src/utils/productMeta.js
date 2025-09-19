import {
  FiCloudSnow,
  FiMaximize,
  FiRefreshCw,
  FiSun,
  FiZap,
} from "react-icons/fi";

export const formatPrice = (value) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

export const normalizeBoolean = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

export const getSeasonMeta = (season) => {
  if (!season) return null;
  const normalized = season.toString().toLowerCase();

  if (normalized.includes("зим")) {
    return { id: "season-winter", icon: FiCloudSnow, label: "Зимняя", qa: "product_season" };
  }

  if (normalized.includes("лет")) {
    return { id: "season-summer", icon: FiSun, label: "Летняя", qa: "product_season" };
  }

  if (normalized.includes("всес") || normalized.includes("all")) {
    return { id: "season-all", icon: FiRefreshCw, label: "Всесезон", qa: "product_season" };
  }

  return { id: "season-other", icon: FiRefreshCw, label: season, qa: "product_season" };
};

export const getStudsMeta = (studs) => {
  if (studs === undefined || studs === null || studs === "") return null;
  const hasStuds = normalizeBoolean(studs);

  return {
    id: "studs",
    icon: FiZap,
    label: hasStuds ? "С шипами" : "Без шипов",
    qa: "product_studs",
    tone: hasStuds ? "accent" : "muted",
  };
};

export const getSizeMeta = (size) => {
  if (!size) return null;
  return {
    id: "size",
    icon: FiMaximize,
    label: size,
    qa: "product_size",
  };
};
