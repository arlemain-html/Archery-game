import { GameEngine } from '../core/Engine';

export interface PointerState {
  isDown: boolean;
  movementX: number;
  movementY: number;
}

export class InputManager {
  private engine: GameEngine;
  private canvas: HTMLCanvasElement;
  
  public pointer: PointerState = {
    isDown: false,
    movementX: 0,
    movementY: 0
  };
  
  public keys: { [key: string]: boolean } = {
    'w': false,
    'a': false,
    's': false,
    'd': false
  };

  private sensitivity: number = 0.002;
  public isLocked: boolean = false;
  
  private isTouchDevice: boolean = false;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;

  constructor(engine: GameEngine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    this.canvas.addEventListener('mousedown', this.onPointerDown);
    document.addEventListener('mousemove', this.onPointerMove);
    document.addEventListener('mouseup', this.onPointerUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    
    // Touch Events
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  public setSensitivity(val: number) {
    this.sensitivity = val;
  }

  private onPointerLockChange() {
    this.isLocked = document.pointerLockElement === this.canvas;
  }
  
  private onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (this.keys[key] !== undefined) {
      this.keys[key] = true;
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (this.keys[key] !== undefined) {
      this.keys[key] = false;
    }
  }

  private onPointerDown(e: MouseEvent) {
    if (this.isTouchDevice) return;
    if (!this.isLocked) {
      this.canvas.requestPointerLock();
      return;
    }

    if (e.button === 0) { // Left click
      this.pointer.isDown = true;
      this.engine.eventBus.emit('PointerDown', this.pointer);
    }
  }

  private onPointerMove(e: MouseEvent) {
    if (this.isTouchDevice || !this.isLocked) return;

    this.pointer.movementX = e.movementX * this.sensitivity;
    this.pointer.movementY = e.movementY * this.sensitivity;
    
    this.engine.eventBus.emit('PointerMove', this.pointer);
  }

  private onPointerUp(e: MouseEvent) {
    if (this.isTouchDevice || !this.isLocked) return;

    if (e.button === 0) {
      this.pointer.isDown = false;
      this.engine.eventBus.emit('PointerUp', this.pointer);
    }
  }

  private onTouchStart(e: TouchEvent) {
    this.isTouchDevice = true;
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;
      this.pointer.isDown = true;
      this.engine.eventBus.emit('PointerDown', this.pointer);
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.lastTouchX;
      const deltaY = touch.clientY - this.lastTouchY;
      
      this.lastTouchX = touch.clientX;
      this.lastTouchY = touch.clientY;

      this.pointer.movementX = deltaX * this.sensitivity * 5; // Higher sensitivity for touch
      this.pointer.movementY = deltaY * this.sensitivity * 5;
      
      this.engine.eventBus.emit('PointerMove', this.pointer);
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      this.pointer.isDown = false;
      this.engine.eventBus.emit('PointerUp', this.pointer);
    }
  }

  public setJoystickDirection(x: number, y: number) {
     this.keys['a'] = x < -0.3;
     this.keys['d'] = x > 0.3;
     this.keys['w'] = y < -0.3;
     this.keys['s'] = y > 0.3;
  }

  public update() {
    // Reset movement delta each frame to prevent drift if mouse stops
    this.pointer.movementX = 0;
    this.pointer.movementY = 0;
  }

  public dispose() {
    this.canvas.removeEventListener('mousedown', this.onPointerDown);
    document.removeEventListener('mousemove', this.onPointerMove);
    document.removeEventListener('mouseup', this.onPointerUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    if (this.isLocked) {
      document.exitPointerLock();
    }
  }
}
