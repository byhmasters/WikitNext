'use client';

// ftml's rendered TOC hard-codes WIKIJUMP.page.listeners.foldToc, so we expose
// our own WIKIT and point WIKIJUMP at it.

type Listeners = {
  foldToc: (event?: Event) => void;
  // ftml's [[*user]] output hard-codes an inline onclick="WIKIDOT.page.listeners.userInfo(n)";
  // we swallow it (return false) and open our own card via the delegated click below.
  userInfo: (...args: unknown[]) => boolean;
};

export interface WikitRuntime {
  page: { listeners: Listeners };
}

declare global {
  interface Window {
    WIKIT?: WikitRuntime;
    WIKIJUMP?: WikitRuntime;
    WIKIDOT?: WikitRuntime;
  }
}

function foldToc(event?: Event) {
  const target = event?.target as HTMLElement | undefined;
  const toc = target?.closest('#wj-toc') ?? document.getElementById('wj-toc');
  const list = toc?.querySelector<HTMLElement>('#wj-toc-list');
  if (!toc || !list) return;
  const folded = toc.classList.toggle('folded');
  list.style.display = folded ? 'none' : '';
}

// ftml's user block renders <a href="/user:info/NAME" onclick="...userInfo(n)">;
// intercept clicks on those (and anything tagged data-wkt-user) and open the card.
function onUserClick(event: MouseEvent) {
  const el = (event.target as HTMLElement | null)?.closest<HTMLElement>(
    '.printuser a[href^="/user:info/"], [data-wkt-user]',
  );
  if (!el) return;

  let handle = el.getAttribute('data-wkt-user') ?? undefined;
  if (!handle) {
    const href = el.getAttribute('href') ?? '';
    const m = href.match(/\/user:info\/([^/?#]+)/);
    if (m) handle = decodeURIComponent(m[1]);
  }
  if (!handle) return;

  event.preventDefault();
  window.dispatchEvent(new CustomEvent('wkt:usercard', { detail: { handle } }));
}

export function installRuntime(): void {
  if (typeof window === 'undefined' || window.WIKIT) return;
  const runtime: WikitRuntime = {
    page: { listeners: { foldToc, userInfo: () => false } },
  };
  window.WIKIT = runtime;
  window.WIKIJUMP = runtime;
  // ftml inline onclick calls WIKIDOT.page.listeners.userInfo — same object
  window.WIKIDOT = runtime;
  document.addEventListener('click', onUserClick);
}
