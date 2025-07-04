export interface HealOptions {
    gridPosition: {
        x: number;
        y: number;
    };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class HealEffect {
    private canvas;
    private ctx;
    private gridX;
    private gridY;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private healingSparkles;
    private restorationWaves;
    private lifeSpirals;
    private cellSize;
    private isComplete;
    constructor(canvas: HTMLCanvasElement, options: HealOptions);
    private initializeHealEffect;
    private createRestorationWave;
    private createHealingSparkles;
    private createLifeSpiral;
    private gridToPixel;
    private updateHealingSparkle;
    private updateRestorationWave;
    private updateLifeSpiral;
    private drawHealingSparkle;
    private drawRestorationWave;
    private drawLifeSpiral;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
