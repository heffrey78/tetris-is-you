export interface LightningBoltOptions {
    gridPosition: {
        x: number;
        y: number;
    };
    intensity: number;
    duration: number;
    autoRemove: boolean;
    direction?: 'horizontal' | 'vertical' | 'diagonal';
}
export declare class LightningBoltEffect {
    private canvas;
    private ctx;
    private gridX;
    private gridY;
    private intensity;
    private duration;
    private autoRemove;
    private direction;
    private startTime;
    private bolts;
    private sparks;
    private cellSize;
    private isComplete;
    constructor(canvas: HTMLCanvasElement, options: LightningBoltOptions);
    private initializeLightningBolt;
    private createMainBolt;
    private generateBoltPath;
    private addBoltBranches;
    private createSparksAlongBolt;
    private gridToPixel;
    private updateBolt;
    private updateSpark;
    private drawBolt;
    private drawSpark;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
