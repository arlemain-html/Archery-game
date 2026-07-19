import { GameEngine } from '../core/Engine';

export class AudioManager {
  private engine: GameEngine;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  public init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  public setVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, val));
    }
  }

  public async loadSound(id: string, url: string): Promise<void> {
    if (this.buffers.has(id)) return;
    this.init();
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.buffers.set(id, audioBuffer);
      this.engine.eventBus.emit('AssetLoaded', { id, type: 'audio' });
    } catch (e) {
      console.error(`Failed to load audio ${url}`, e);
    }
  }

  public playSound(id: string, volume: number = 1.0) {
    if (!this.audioContext || !this.masterGain) return;
    const buffer = this.buffers.get(id);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    source.start(0);
  }
}
