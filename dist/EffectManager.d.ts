import { Position } from './types.js';
import { AcidPool } from './effects/AcidEffect.js';
import { CrumblingBrickEffect } from './effects/CrumblingBrickEffect.js';
import { BigExplosionEffect } from './effects/BigExplosionEffect.js';
import { FairyDustEffect } from './effects/FairyDustEffect.js';
import { LightningStormEffect } from './effects/LightningStormEffect.js';
import { LightningBoltEffect } from './effects/LightningBoltEffect.js';
import { MultiplyEffect } from './effects/MultiplyEffect.js';
import { TeleportEffect } from './effects/TeleportEffect.js';
import { MagnetEffect } from './effects/MagnetEffect.js';
import { TransformEffect } from './effects/TransformEffect.js';
import { HealEffect } from './effects/HealEffect.js';
export interface Particle {
    x: number;
    y: number;
    life: number;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    isDead(): boolean;
}
export type EffectType = 'acid_drip' | 'flame' | 'crumbling_brick' | 'explosion' | 'freeze' | 'lightning' | 'big_explosion_combo' | 'fairy_dust_combo' | 'lightning_storm_combo' | 'lightning_bolt' | 'multiply' | 'teleport' | 'magnet' | 'transform' | 'heal';
export interface EffectConfig {
    type: EffectType;
    gridPosition: Position;
    intensity?: number;
    duration?: number;
    autoRemove?: boolean;
}
export interface ActiveEffect {
    id: string;
    type: EffectType;
    gridPosition: Position;
    particles: Particle[];
    intensity: number;
    duration: number;
    elapsed: number;
    active: boolean;
    autoRemove: boolean;
    acidPool?: AcidPool;
    crumblingBrick?: CrumblingBrickEffect;
    bigExplosion?: BigExplosionEffect;
    fairyDust?: FairyDustEffect;
    lightningStorm?: LightningStormEffect;
    lightningBolt?: LightningBoltEffect;
    multiply?: MultiplyEffect;
    teleport?: TeleportEffect;
    magnet?: MagnetEffect;
    transform?: TransformEffect;
    heal?: HealEffect;
}
export declare class EffectManager {
    private canvas;
    private ctx;
    private effects;
    private playfieldStartX;
    private playfieldStartY;
    private gridSize;
    private nextEffectId;
    constructor(canvas: HTMLCanvasElement);
    /**
     * Add a new effect at the specified grid position
     */
    addEffect(config: EffectConfig): string;
    /**
     * Remove an effect by ID
     */
    removeEffect(effectId: string): void;
    /**
     * Remove all effects at a specific grid position
     */
    removeEffectsAt(gridPosition: Position): void;
    /**
     * Stop an effect (prevent new particles, let existing ones finish)
     */
    stopEffect(effectId: string): void;
    /**
     * Update all active effects
     */
    update(deltaTime: number): void;
    /**
     * Render all effects on the canvas
     */
    render(): void;
    /**
     * Convert grid coordinates to pixel coordinates
     */
    private gridToPixel;
    /**
     * Update a single effect
     */
    private updateEffect;
    /**
     * Render a single effect
     */
    private renderEffect;
    /**
     * Create new particles for an effect based on its type
     */
    private createParticles;
    /**
     * Create acid drip particles
     */
    private createAcidParticles;
    private createFlameParticles;
    private createCrumbleParticles;
    private createExplosionParticles;
    private createFreezeParticles;
    private createLightningParticles;
    /**
     * Add a combo effect (full-screen animation)
     */
    addComboEffect(comboLevel: number, intensity?: number): string;
    /**
     * Get all active effects at a grid position
     */
    getEffectsAt(gridPosition: Position): ActiveEffect[];
    /**
     * Check if any effects are active at a position
     */
    hasEffectsAt(gridPosition: Position): boolean;
    /**
     * Clear all effects
     */
    clear(): void;
    /**
     * Get total number of active effects
     */
    getEffectCount(): number;
    /**
     * Get total number of particles across all effects
     */
    getParticleCount(): number;
}
