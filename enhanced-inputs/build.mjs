import esbuild from 'esbuild';
import { cpSync, existsSync, mkdirSync } from 'fs';

// Per-file builds: every input module (including the deprecated standalone
// <input-*> tags, which still build for reference but are no longer part of
// the main entry point). Static list — do not derive from src/index.js, whose
// exports are the curated public surface, not the build manifest.
const individualEntryPoints = [
  './src/inputs/e-input.js',
  './src/inputs/e-input-options.js',
  './src/inputs/e-input-text.js',
  './src/inputs/e-input-email.js',
  './src/inputs/e-input-password.js',
  './src/inputs/e-input-url.js',
  './src/inputs/e-input-search.js',
  './src/inputs/e-input-number.js',
  './src/inputs/e-input-phone.js',
  './src/inputs/e-input-date.js',
  './src/inputs/e-input-color.js',
  './src/inputs/e-input-textarea.js',
  './src/inputs/e-input-select.js',
  './src/inputs/e-input-combobox.js',
  './src/inputs/e-input-radio.js',
  './src/inputs/e-input-checkbox.js',
  './src/inputs/e-input-toggle.js',
  './src/inputs/e-input-range.js',
];

// Runtime deps externalized in the ESM build (package.json `dependencies`
// install them for ESM consumers; `zod` is additionally a peer). The IIFE
// stays fully self-contained for side-effect <script> use — see below.
const externalDeps = [
  'zod',
  'lit', 'lit/*',
  'maska', 'maska/*',
  '@leeoniya/ufuzzy', '@leeoniya/ufuzzy/*',
  '@simonwep/pickr', '@simonwep/pickr/*',
  'range-slider-element', 'range-slider-element/*',
];

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

const iifeOptions = {
  bundle: true,
  format: 'iife',
  globalName: 'EnhancedInputs',
  minify: true,
  target: 'es2017',
  treeShaking: true,
  logLevel: 'info',
};

const singleCtx = await esbuild.context({
  entryPoints: ['./src/index.js'],
  outfile: './dist/index.js',
  ...iifeOptions,
  // Self-contained: every runtime dep (including zod) is inlined so the
  // IIFE works as a side-effect <script> with zero installs. The ESM build
  // below is the peer-honoring entry point instead.
});

const esmCtx = await esbuild.context({
  entryPoints: ['./src/index.js'],
  outfile: './dist/index.esm.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: true,
  target: 'es2017',
  treeShaking: true,
  logLevel: 'info',
  external: externalDeps,
});

const individualCtx = await esbuild.context({
  entryPoints: individualEntryPoints,
  outdir: 'dist/inputs',
  outbase: 'src/inputs',
  ...iifeOptions,
});

if (isWatch) {
  console.log('Watching for changes...');
  await Promise.all([
    singleCtx.watch(),
    esmCtx.watch(),
    individualCtx.watch(),
  ]);
} else {
  await Promise.all([
    singleCtx.rebuild(),
    esmCtx.rebuild(),
    individualCtx.rebuild(),
  ]);
  // Ship tracked sources that esbuild never emits: the six hand-authored
  // themes and the hand-written type declarations. Without this step a
  // clean `rm -rf dist` destroys artifacts package.json points at (EI1).
  mkdirSync('./dist/themes', { recursive: true });
  cpSync('./src/themes', './dist/themes', { recursive: true });
  cpSync('./src/index.d.ts', './dist/index.d.ts');
  console.log(`Build complete! ${individualEntryPoints.length} inputs → dist/ (+ index.esm.js, themes, index.d.ts)`);
  process.exit(0);
}
