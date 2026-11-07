export function getDCThemeInitializationScript(): string {
  return `
    (function () {
      try {
        var root = document.documentElement;
        var saved = localStorage.getItem("data-dc-theme") || localStorage.getItem("data-theme");
        var resolved = saved === "dark" || saved === "light"
          ? saved
          : "dark";
        root.setAttribute("data-theme", resolved);
        root.setAttribute("data-dc-theme", resolved);
      } catch (_) {
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.setAttribute("data-dc-theme", "dark");
      }
    })();
  `;
}
