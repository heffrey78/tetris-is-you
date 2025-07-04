export interface MultiplyOptions {
    gridPosition: {
        x: number;
        y: number;
    };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class MultiplyEffect {
    private canvas;
    private ctx;
    private gridX;
    private gridY;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private ripples;
    private particles;
    private beams;
    private cellSize;
    private isComplete;
    constructor(canvas: HTMLCanvasElement, options: MultiplyOptions);
    private initializeMultiplyEffect;
    private createDuplicationRipple;
    private createSplitBeams;
    private createCloneParticles;
    private gridToPixel;
    private updateRipple;
    private updateBeam;
    private updateParticle;
    private drawRipple;
    private drawBeam;
    private drawParticle;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
