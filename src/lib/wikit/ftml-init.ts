import initFtml, { initSync } from '@/lib/ftml/ftml.js';

let ready: Promise<void> | null = null;

export function ensureFtml(): Promise<void> {
  if (ready) return ready;

  ready = (async () => {
    if (typeof window === 'undefined') {
      // server: read the wasm off disk and init synchronously
      const { readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const wasmPath = join(process.cwd(), 'src', 'lib', 'ftml', 'ftml_bg.wasm');
      initSync({ module: readFileSync(wasmPath) });
    } else {
      // browser: fetch the copy served from /public
      await initFtml({ module_or_path: '/ftml_bg.wasm' });
    }
  })();

  return ready;
}
