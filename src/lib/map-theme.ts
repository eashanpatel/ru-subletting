/** Mapbox style and overlay colours for the current light or dark theme. */
export function mapTheme() {
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return dark
    ? {
        style: "mapbox://styles/mapbox/dark-v11",
        zone: "#8fb0f0",
        zoneText: "#c9d8f7",
        halo: "#10182c",
        pin: "#e25a4b",
      }
    : {
        style: "mapbox://styles/mapbox/light-v11",
        zone: "#2b5bb0",
        zoneText: "#1f3f80",
        halo: "#ffffff",
        pin: "#c5372c",
      };
}

/** Calls back whenever the theme class on <html> changes. Returns a cleanup. */
export function onThemeChange(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
