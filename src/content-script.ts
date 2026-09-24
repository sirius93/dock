// Only job: tell the background worker "don't route this one" when the user
// shift-clicks a link (F1 bypass). Reads nothing else from the page.
document.addEventListener(
  "click",
  (event: MouseEvent) => {
    if (!event.shiftKey) return;
    const target = event.target as HTMLElement | null;
    const link = target?.closest("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    chrome.runtime.sendMessage({ type: "dock-bypass", url: link.href });
  },
  true,
);
