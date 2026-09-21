export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export const MINUTE = 60_000;
export const MAX_MINUTES = 60;

export function normalizeMinutes(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.min(MAX_MINUTES, Math.round(value))) : 5;
}

export class SnackTimer {
  minutes: number;
  status: TimerStatus = 'idle';
  private accumulated = 0;
  private startedAt = 0;

  constructor(minutes = 5) {
    this.minutes = normalizeMinutes(minutes);
  }

  get duration(): number {
    return this.minutes * MINUTE;
  }

  elapsed(now: number): number {
    const active = this.status === 'running' ? Math.max(0, now - this.startedAt) : 0;
    return Math.min(this.duration, this.accumulated + active);
  }

  remaining(now: number): number {
    return this.duration - this.elapsed(now);
  }

  eaten(now: number): number {
    return Math.floor(this.elapsed(now) / MINUTE);
  }

  setMinutes(minutes: number): void {
    if (this.status !== 'idle') return;
    this.minutes = normalizeMinutes(minutes);
  }

  start(now: number): void {
    if (this.status !== 'idle' && this.status !== 'paused') return;
    this.startedAt = now;
    this.status = 'running';
  }

  pause(now: number): void {
    if (this.status !== 'running') return;
    if (this.tick(now)) return;
    this.accumulated = this.elapsed(now);
    this.status = 'paused';
  }

  tick(now: number): boolean {
    if (this.status !== 'running' || this.remaining(now) > 0) return false;
    this.accumulated = this.duration;
    this.status = 'finished';
    return true;
  }

  reset(): void {
    this.accumulated = 0;
    this.startedAt = 0;
    this.status = 'idle';
  }
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
