// Rush Kitchen — entrypoint (program/v1).
//
// The grader runs this file with Node 22 in a fresh container: a read-only
// copy of the repository and a writable output directory. It copies game/
// and screenshots/ into the output directory and writes dossier.json there
// with buildDossier from vendor/makefun-game.ts, so the sealed scorer can
// check the game files, the screenshots and the dossier byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Standard library only. Deterministic: the same repository always writes
// the same bytes, so the grader's two runs agree.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The output directory: the grader's /output, or MAKEFUN_OUTPUT_DIR locally.
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
// This file lives at the repository root; game/ and screenshots/ sit beside it.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

// The dossier caps are the competition's own limits: the text budget the
// judge view is cut from, at most 4 screenshots of 256 KiB, and the game
// tree limits the gate enforces.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, dereference: false });
}

function main(): void {
  // Never remove the output directory: the grader owns it and may already
  // hold files. Create it (and its parents) if it is missing, then copy
  // the game and the screenshots into it.
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyTree(join(REPO_ROOT, 'game'), join(OUTPUT_DIR, 'game'));
  copyTree(join(REPO_ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'));

  // The dossier is built from the copied tree, so what the scorer reads is
  // exactly what this program wrote.
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(
    `wrote ${join(OUTPUT_DIR, 'dossier.json')} (${dossier.length} bytes)`,
  );
}

main();
