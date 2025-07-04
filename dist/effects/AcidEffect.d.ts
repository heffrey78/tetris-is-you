import { Particle } from '../EffectManager.js';
export declare class AcidDrop implements Particle {
    x: number;
    y: number;
    life: number;
    private vx;
    private vy;
    private size;
    private decay;
    private acidity;
    private viscosity;
    private trail;
    private maxTrailLength;
    constructor(x: number, y: number);
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    isDead(): boolean;
    setViscosity(viscosity: number): void;
}
export declare class AcidBubble implements Particle {
    x: number;
    y: number;
    life: number;
    private size;
    private maxLife;
    private speed;
    private opacity;
    constructor(x: number, y: number);
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    isDead(): boolean;
}
export declare class AcidPool {
    private x;
    private y;
    private width;
    private level;
    private maxLevel;
    constructor(x: number, y: number, width: number);
    addDrop(): void;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    getLevel(): number;
}
