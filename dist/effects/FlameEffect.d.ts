import { Particle } from '../EffectManager.js';
export declare class FlameParticle implements Particle {
    x: number;
    y: number;
    life: number;
    private vx;
    private vy;
    private decay;
    private size;
    private heat;
    constructor(x: number, y: number, intensity?: number);
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    isDead(): boolean;
}
