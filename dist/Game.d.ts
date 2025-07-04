import { GameConfig } from './GameConfig.js';
import { AudioSystem } from './AudioSystem.js';
export declare class Game {
    private canvas;
    private renderer;
    private ruleEngine;
    private wordQueue;
    private gameLogic;
    private uiManager;
    private gameLogger;
    private audioSystem;
    private config;
    private gameLoop;
    private lastTime;
    private fps;
    private frameTime;
    private isRunning;
    private isPaused;
    private gameState;
    constructor(canvas: HTMLCanvasElement, config?: GameConfig);
    /**
     * Load and apply a new configuration
     */
    loadConfiguration(difficulty: 'easy' | 'normal' | 'hard'): Promise<void>;
    /**
     * Get current configuration
     */
    getConfiguration(): GameConfig;
    /**
     * Get audio system for external control
     */
    getAudioSystem(): AudioSystem;
    private setupCanvas;
    private initializeGameState;
    private createEmptyPlayfield;
    start(): Promise<void>;
    stop(): void;
    pause(): void;
    private loop;
    private update;
    private render;
    handleKeyDown(event: KeyboardEvent): void;
    handleKeyUp(event: KeyboardEvent): void;
    private testLineClear;
    restart(): void;
}
