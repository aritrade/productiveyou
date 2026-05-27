// Non-interactive Bubblewrap project scaffolder.
// Reads our local web manifest, builds a TwaManifest, generates the Android
// project, and creates a signing key — all without prompts.
//
// Run from a directory that will hold the generated Android project.

import { resolve, join } from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

const corePath =
  process.env.BUBBLEWRAP_CORE ||
  '/Users/aritra.de/.nvm/versions/node/v24.14.1/lib/node_modules/@bubblewrap/cli/node_modules/@bubblewrap/core/dist/index.js';
const core = await import(corePath);
const { TwaManifest, TwaGenerator, JdkHelper, KeyTool, Config, ConsoleLog } = core;

const WEB_MANIFEST_URL = process.env.WEB_MANIFEST_URL || 'http://localhost:8765/manifest.webmanifest';
const TARGET_DIR = process.env.TARGET_DIR || process.cwd();
const PACKAGE_ID = process.env.PACKAGE_ID || 'app.productiveyou.twa';
const KEYSTORE_PASSWORD = process.env.BUBBLEWRAP_KEYSTORE_PASSWORD || 'monkmode';
const KEY_PASSWORD = process.env.BUBBLEWRAP_KEY_PASSWORD || 'monkmode';
const KEY_ALIAS = process.env.KEY_ALIAS || 'android';

const log = new ConsoleLog('scaffold');

console.log(`▶ web manifest:  ${WEB_MANIFEST_URL}`);
console.log(`▶ target dir:    ${TARGET_DIR}`);
console.log(`▶ package id:    ${PACKAGE_ID}`);
console.log();

await fs.mkdir(TARGET_DIR, { recursive: true });

// 1) Load web manifest into a TwaManifest
const twaManifest = await TwaManifest.fromWebManifest(WEB_MANIFEST_URL);

// 2) Override / pin the fields we care about
twaManifest.packageId = PACKAGE_ID;
twaManifest.name = 'Monk Mode Activated';
twaManifest.launcherName = 'Monk Mode';
twaManifest.appVersionCode = 1;
twaManifest.appVersionName = '1.0.0';
// Make sure host + start URL point at the LIVE site so auth (Supabase) works
twaManifest.host = 'productiveyou.lovable.app';
twaManifest.startUrl = '/?source=twa';
twaManifest.fullScopeUrl = new URL('https://productiveyou.lovable.app/');
twaManifest.fallbackType = 'customtabs';
twaManifest.signingKey = {
  path: resolve(TARGET_DIR, 'android.keystore'),
  alias: KEY_ALIAS,
};
twaManifest.generatorApp = 'scaffold.mjs (productiveyou)';

console.log('▶ twa-manifest values:');
console.log(`    host:            ${twaManifest.host}`);
console.log(`    startUrl:        ${twaManifest.startUrl}`);
console.log(`    packageId:       ${twaManifest.packageId}`);
console.log(`    name:            ${twaManifest.name}`);
console.log(`    launcherName:    ${twaManifest.launcherName}`);
console.log(`    themeColor:      ${twaManifest.themeColor.hex()}`);
console.log(`    backgroundColor: ${twaManifest.backgroundColor.hex()}`);
console.log(`    iconUrl:         ${twaManifest.iconUrl}`);
console.log(`    maskableIconUrl: ${twaManifest.maskableIconUrl || '(none)'}`);
console.log(`    signingKey:      ${twaManifest.signingKey.path}`);
console.log();

// 3) Save twa-manifest.json
const manifestPath = join(TARGET_DIR, 'twa-manifest.json');
await twaManifest.saveToFile(manifestPath);
console.log(`✓ wrote ${manifestPath}`);

// 4) Generate the Android project from the TwaManifest
const gen = new TwaGenerator();
await gen.createTwaProject(TARGET_DIR, twaManifest, log);
console.log('✓ generated Android project');

// 5) Write the manifest checksum so `bubblewrap build` skips the regenerate prompt
const { createHash } = await import('node:crypto');
const manifestBytes = await fs.readFile(manifestPath);
const checksum = createHash('sha256').update(manifestBytes).digest('hex');
await fs.writeFile(join(TARGET_DIR, 'manifest-checksum.txt'), checksum);
console.log('✓ wrote manifest-checksum.txt');

// 6) Create the signing key non-interactively
const config = new Config(
  process.env.JAVA_HOME,
  process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT,
);
const jdkHelper = new JdkHelper(process, config);
const keytool = new KeyTool(jdkHelper);
const exists = await fs.access(twaManifest.signingKey.path).then(() => true).catch(() => false);
if (exists) {
  console.log('✓ signing key already exists, skipping');
} else {
  console.log('▶ generating signing key …');
  await keytool.createSigningKey(
    {
      fullName: 'Productive You',
      organizationalUnit: 'Engineering',
      organization: 'Productive You',
      country: 'US',
      password: KEYSTORE_PASSWORD,
      keypassword: KEY_PASSWORD,
      alias: KEY_ALIAS,
      path: twaManifest.signingKey.path,
    },
    /* overwrite */ false,
  );
  console.log(`✓ created signing key at ${twaManifest.signingKey.path}`);
}

console.log('\n✓ scaffold complete — next: bubblewrap build');
