export interface FairyDustOptions {
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class FairyDustEffect {
    private canvas;
    private ctx;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private particles;
    private ripples;
    private isComplete;
    private particleSpawnTimer;
    constructor(canvas: HTMLCanvasElement, options: FairyDustOptions);
    private initializeFairyDust;
    private createMagicalRipple;
    private createFairyDustWave;
    private createFairyParticle;
    private updateParticle;
    private updateRipple;
    private drawParticle;
    private drawRipple;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
