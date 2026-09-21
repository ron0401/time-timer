import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatTime, MINUTE, normalizeMinutes, SnackTimer } from './timer.ts';

test('one apple is fully eaten only after each full minute', () => {
  const timer = new SnackTimer(5);
  timer.start(1_000);
  assert.equal(timer.eaten(60_999), 0);
  assert.equal(timer.eaten(61_000), 1);
  assert.equal(timer.eaten(121_000), 2);
  assert.equal(timer.remaining(121_000), 3 * MINUTE);
});
test('background time is counted even when ticks are delayed', () => {
  const timer = new SnackTimer(5);
  timer.start(10_000);
  assert.equal(timer.tick(250_000), false);
  assert.equal(timer.eaten(250_000), 4);
  assert.equal(timer.tick(900_000), true);
  assert.equal(timer.status, 'finished');
  assert.equal(timer.remaining(900_000), 0);
  assert.equal(timer.eaten(900_000), 5);
  assert.equal(timer.tick(901_000), false);
});
test('pause and resume preserve elapsed time and exclude the pause', () => {
  const timer = new SnackTimer(2);
  timer.start(0);
  timer.pause(35_000);
  assert.equal(timer.remaining(90_000), 85_000);
  timer.start(100_000);
  assert.equal(timer.eaten(124_999), 0);
  assert.equal(timer.eaten(125_000), 1);
  timer.pause(140_000);
  timer.start(200_000);
  assert.equal(timer.tick(245_000), true);
});
test('reset restores all apples and keeps the selected duration', () => {
  const timer = new SnackTimer(3);
  timer.start(0);
  timer.tick(2 * MINUTE);
  timer.reset();
  assert.equal(timer.status, 'idle');
  assert.equal(timer.eaten(10 * MINUTE), 0);
  assert.equal(timer.remaining(10 * MINUTE), 3 * MINUTE);
});
test('invalid settings are normalized and running duration cannot change', () => {
  assert.equal(normalizeMinutes(0), 1);
  assert.equal(normalizeMinutes(61), 60);
  assert.equal(normalizeMinutes(2.6), 3);
  assert.equal(normalizeMinutes(Number.NaN), 5);
  const timer = new SnackTimer(2);
  timer.start(0);
  timer.setMinutes(10);
  assert.equal(timer.minutes, 2);
  timer.start(50_000);
  assert.equal(timer.remaining(60_000), MINUTE);
});
test('pausing after the deadline finishes without negative time', () => {
  const timer = new SnackTimer(1);
  timer.start(0);
  timer.pause(70_000);
  assert.equal(timer.status, 'finished');
  assert.equal(timer.remaining(70_000), 0);
  assert.equal(formatTime(timer.remaining(70_000)), '00:00');
});
test('time display rounds partial seconds up', () => {
  assert.equal(formatTime(60_000), '01:00');
  assert.equal(formatTime(59_999), '01:00');
  assert.equal(formatTime(59_000), '00:59');
  assert.equal(formatTime(1), '00:01');
  assert.equal(formatTime(-1), '00:00');
});
