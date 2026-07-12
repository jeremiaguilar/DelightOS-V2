/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class DelightSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft double chime (e.g. for new orders)
  playNewOrder() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Chime 1
      this.playTone(523.25, 'sine', now, 0.15, 0.1); // C5
      // Chime 2
      this.playTone(659.25, 'sine', now + 0.12, 0.25, 0.1); // E5
    } catch (e) {
      console.warn('Web Audio API not supported or user interaction required', e);
    }
  }

  // Gentle alert pulse (e.g. for under 3 minutes left)
  playUpcomingExpiry() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      this.playTone(440.00, 'triangle', now, 0.15, 0.08); // A4
      this.playTone(440.00, 'triangle', now + 0.2, 0.15, 0.08); // A4
    } catch (e) {
      console.warn(e);
    }
  }

  // Low warning pulse (e.g. for late order > 18 minutes)
  playDelayed() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      this.playTone(293.66, 'sawtooth', now, 0.3, 0.05); // D4
      this.playTone(293.66, 'sawtooth', now + 0.4, 0.3, 0.05); // D4
    } catch (e) {
      console.warn(e);
    }
  }

  // Pleasant success fanfare (e.g. for completed order)
  playReady() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      this.playTone(523.25, 'sine', now, 0.1, 0.1); // C5
      this.playTone(659.25, 'sine', now + 0.08, 0.1, 0.1); // E5
      this.playTone(783.99, 'sine', now + 0.16, 0.1, 0.1); // G5
      this.playTone(1046.50, 'sine', now + 0.24, 0.3, 0.12); // C6
    } catch (e) {
      console.warn(e);
    }
  }

  private playTone(freq: number, type: OscillatorType, start: number, duration: number, volume: number) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    
    // Smooth envelope to prevent popping clicks
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(volume, start + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start(start);
    osc.stop(start + duration);
  }
}

export const synth = new DelightSynth();
