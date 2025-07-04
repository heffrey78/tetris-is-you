export interface MagnetOptions {
    gridPosition: {
        x: number;
        y: number;
    };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class MagnetEffect {
    private canvas;
    private ctx;
    private gridX;
    private gridY;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private fieldLines;
    private ironFilings;
    private magneticPulses;
    private cellSize;
    private isComplete;
    constructor(canvas: HTMLCanvasElement, options: MagnetOptions);
    private initializeMagnetEffect;
    private createFieldLines;
    private createIronFilings;
    private createMagneticPulse;
    private gridToPixel;
    private updateFieldLine;
    private updateIronFiling;
    private updateMagneticPulse;
    private drawFieldLine;
    private getQuadraticBezierPoint;
    private drawIronFiling;
    private drawMagneticPulse;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
