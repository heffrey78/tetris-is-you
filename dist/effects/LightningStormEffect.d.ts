export interface LightningStormOptions {
    intensity: number;
    duration: number;
    autoRemove: boolean;
}
export declare class LightningStormEffect {
    private canvas;
    private ctx;
    private intensity;
    private duration;
    private autoRemove;
    private startTime;
    private bolts;
    private clouds;
    private sparks;
    private isComplete;
    private boltTimer;
    constructor(canvas: HTMLCanvasElement, options: LightningStormOptions);
    private initializeLightningStorm;
    private createThunderClouds;
    private createLightningBolt;
    private generateLightningPath;
    private createElectricSparks;
    private flashNearestCloud;
    private updateLightningBolt;
    private updateThunderCloud;
    private updateElectricSpark;
    private drawLightningBolt;
    private drawThunderCloud;
    private drawElectricSpark;
    update(deltaTime: number): void;
    render(): void;
    isFinished(): boolean;
    cleanup(): void;
}
