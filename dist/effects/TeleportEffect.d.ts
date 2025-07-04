export interface TeleportOptions {
    gridPosition: {
        x: number;
        y: number;
    };
    targetPosition?: {
        x: number;
        y: number;
    };
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class TeleportEffect {
    private canvas;
    private ctx;
    private gridX;
    private gridY;
    private targetX;
    private targetY;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private portals;
    private vortexParticles;
    private warpBeams;
    private cellSize;
    private isComplete;
    constructor(canvas: HTMLCanvasElement, options: TeleportOptions);
    private initializeTeleportEffect;
    private createPortal;
    private createVortexParticles;
    private createWarpBeam;
    private gridToPixel;
    private updatePortal;
    private updateVortexParticle;
    private updateWarpBeam;
    private drawPortal;
    private drawVortexParticle;
    private drawWarpBeam;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
