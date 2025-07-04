export interface CrumblingBrickOptions {
    gridPosition: {
        x: number;
        y: number;
    };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class CrumblingBrickEffect {
    private canvas;
    private ctx;
    private gridX;
    private gridY;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private pieces;
    private dust;
    private cellSize;
    constructor(canvas: HTMLCanvasElement, options: CrumblingBrickOptions);
    private initializeCrumbling;
    private createBrickPiece;
    private createDustParticle;
    private getBrickColor;
    private updateBrickPiece;
    private updateDustParticle;
    private drawBrickPiece;
    private drawDustParticle;
    private lightenColor;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
