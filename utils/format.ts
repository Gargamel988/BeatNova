 const formatTime = (secondsTotal: number) => {
    const totalSeconds = Math.floor(secondsTotal);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
      return "0:00";
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const formathour = (hours: number) => {
    const totalSeconds = Math.floor(hours);
    const minutes = Math.floor(totalSeconds / 60);
    const hoursResult = Math.floor(minutes / 60);
    if (!Number.isFinite(minutes) || !Number.isFinite(hoursResult)) {
      return "0:00";
    }
    if (hoursResult > 0) {
      return `${hoursResult} saat ${minutes % 60} dk`;
    }
    return `${minutes % 60} dakika`;
  };
  const formatDailyAverage = (dailyPlaySeconds: number[]) => {
    const totalSeconds = dailyPlaySeconds.reduce((sum, val) => sum + val, 0);
    const averageSeconds = totalSeconds / dailyPlaySeconds.length;
    return formathour(averageSeconds);
  };
export const formatLocalizedDuration = (
  secondsTotal: number,
  t: (key: string, opt?: any) => string
): string => {
  const total = Math.floor(secondsTotal);
  if (!Number.isFinite(total) || total <= 0) return "-";
  const m = Math.floor(total / 60);
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h > 0) {
    return t("galaxy.durationHoursMinutes", {
      hours: h,
      minutes: remM,
      defaultValue: `${h}h ${remM}m`,
    });
  }
  return t("galaxy.durationMinutes", {
    minutes: Math.max(1, remM),
    defaultValue: `${Math.max(1, remM)}m`,
  });
};

export { formatTime, formathour, formatDailyAverage };