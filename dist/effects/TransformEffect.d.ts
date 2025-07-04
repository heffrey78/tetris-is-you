export interface TransformOptions {
    gridPosition: {
        x: number;
        y: number;
    };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class TransformEffect {
    private canvas;
    private ctx;
    private gridX;
    private gridY;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private transformWaves;
    private morphParticles;
    private colorRipples;
    private cellSize;
    private isComplete;
    constructor(canvas: HTMLCanvasElement, options: TransformOptions);
    private initializeTransformEffect;
    private createTransformWave;
    private createMorphParticles;
    private createColorRipples;
    private gridToPixel;
    private updateTransformWave;
    private updateMorphParticle;
    private updateColorRipple;
    private getColorFromPhase;
    private drawTransformWave;
    private drawMorphParticle;
    private drawColorRipple;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
