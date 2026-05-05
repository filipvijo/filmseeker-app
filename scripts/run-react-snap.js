const { spawnSync } = require('child_process');
const path = require('path');

if (process.env.SKIP_REACT_SNAP === '1') {
  console.log('Skipping react-snap because SKIP_REACT_SNAP=1');
  process.exit(0);
}

const executable = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'react-snap.cmd' : 'react-snap'
);

const result = spawnSync(executable, [], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(process.env.REQUIRE_REACT_SNAP === '1' ? 1 : 0);
}

if (result.status) {
  const message = `react-snap exited with status ${result.status}`;
  if (process.env.REQUIRE_REACT_SNAP === '1') {
    console.error(message);
    process.exit(result.status);
  }

  console.warn(`${message}; continuing because the static SEO fallback is present.`);
  process.exit(0);
}

process.exit(0);
