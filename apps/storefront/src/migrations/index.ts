import * as migration_20260523_193448_initial from './20260523_193448_initial';

export const migrations = [
  {
    up: migration_20260523_193448_initial.up,
    down: migration_20260523_193448_initial.down,
    name: '20260523_193448_initial'
  },
];
