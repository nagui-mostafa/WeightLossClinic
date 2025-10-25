#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const os = require('os');

if (typeof os.availableParallelism !== 'function') {
  os.availableParallelism = () => {
    const cpus = os.cpus?.();
    return Math.max(1, Array.isArray(cpus) ? cpus.length : 1);
  };
}

require('jest/bin/jest');
