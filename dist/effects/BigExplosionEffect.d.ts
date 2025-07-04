export interface BigExplosionOptions {
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class BigExplosionEffect {
    private canvas;
    private ctx;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private particles;
    private shockwaves;
    private isComplete;
    constructor(canvas: HTMLCanvasElement, options: BigExplosionOptions);
    private initializeExplosion;
    private createParticleWave;
    private getSpeedForType;
    private getSizeForType;
    private getDecayForType;
    private getColorForType;
    private updateParticle;
    private updateShockwave;
    private drawParticle;
    private drawShockwave;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
