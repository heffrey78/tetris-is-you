import { Position, Color, LAYOUT } from './types.js';
import { GameConfig } from './GameConfig.js';
import { AcidDrop, AcidBubble, AcidPool } from './effects/AcidEffect.js';
import { CrumblingBrickEffect } from './effects/CrumblingBrickEffect.js';
import { FlameParticle } from './effects/FlameEffect.js';
import { BigExplosionEffect } from './effects/BigExplosionEffect.js';
import { FairyDustEffect } from './effects/FairyDustEffect.js';
import { LightningStormEffect } from './effects/LightningStormEffect.js';
import { LightningBoltEffect } from './effects/LightningBoltEffect.js';
import { MultiplyEffect } from './effects/MultiplyEffect.js';
import { TeleportEffect } from './effects/TeleportEffect.js';
import { MagnetEffect } from './effects/MagnetEffect.js';
import { TransformEffect } from './effects/TransformEffect.js';
import { HealEffect } from './effects/HealEffect.js';

// Base interface for all particle effects
export interface Particle {
    x: number;
    y: number;
    life: number;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    isDead(): boolean;
}

// Effect types that can be triggered
export type EffectType = 'acid_drip' | 'flame' | 'crumbling_brick' | 'explosion' | 'freeze' | 'lightning' | 'big_explosion_combo' | 'fairy_dust_combo' | 'lightning_storm_combo' | 'lightning_bolt' | 'multiply' | 'teleport' | 'magnet' | 'transform' | 'heal';

// Effect configuration
export interface EffectConfig {
    type: EffectType;
    gridPosition: Position;
    intensity?: number;
    duration?: number;
    autoRemove?: boolean;
}

// Active effect instance
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
    acidPool?: AcidPool; // For acid effects
    crumblingBrick?: CrumblingBrickEffect; // For crumbling brick effects
    bigExplosion?: BigExplosionEffect; // For big explosion combo effects
    fairyDust?: FairyDustEffect; // For fairy dust combo effects
    lightningStorm?: LightningStormEffect; // For lightning storm combo effects
    lightningBolt?: LightningBoltEffect; // For lightning bolt spell effects
    multiply?: MultiplyEffect; // For multiply spell effects
    teleport?: TeleportEffect; // For teleport spell effects
    magnet?: MagnetEffect; // For magnet spell effects
    transform?: TransformEffect; // For transform spell effects
    heal?: HealEffect; // For heal spell effects
}

export class EffectManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private effects: Map<string, ActiveEffect> = new Map();
    private playfieldStartX: number;
    private playfieldStartY: number;
    private gridSize: number;
    private nextEffectId: number = 1;
    private config: GameConfig | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D rendering context for EffectManager');
        }
        this.ctx = context;

        // Match the renderer's layout calculations
        const scaledMargin = (LAYOUT as any).SCALED_MARGIN || LAYOUT.MARGIN;
        this.playfieldStartX = scaledMargin;
        this.playfieldStartY = scaledMargin;
        this.gridSize = (LAYOUT as any).SCALED_GRID_SIZE || LAYOUT.GRID_SIZE;
    }

    /**
     * Set the game configuration for effect intensity control
     */
    public setConfig(config: GameConfig): void {
        this.config = config;
    }

    /**
     * Add a new effect at the specified grid position
     */
    public addEffect(config: EffectConfig): string {
        // Check if we've hit the maximum concurrent effects limit
        if (this.config && this.effects.size >= this.config.effectIntensity.maxConcurrentEffects) {
            console.log(`⚠️ EFFECT LIMIT REACHED: Skipping ${config.type} (${this.effects.size}/${this.config.effectIntensity.maxConcurrentEffects})`);
            return ''; // Return empty ID to indicate effect was not created
        }

        const effectId = `effect_${this.nextEffectId++}`;
        console.log(`✨ CREATING EFFECT: ${config.type} at (${config.gridPosition.x}, ${config.gridPosition.y}) with ID ${effectId}`);
        
        // Apply configuration intensity multipliers
        const intensity = this.config ? 
            (config.intensity || 1.0) * this.config.effectIntensity.particleCount : 
            (config.intensity || 1.0);
        
        const duration = this.config ? 
            (config.duration || Infinity) * this.config.effectIntensity.animationDuration : 
            (config.duration || Infinity);
        
        const effect: ActiveEffect = {
            id: effectId,
            type: config.type,
            gridPosition: config.gridPosition,
            particles: [],
            intensity: intensity,
            duration: duration,
            elapsed: 0,
            active: true,
            autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
        };

        // Initialize special effect data
        if (config.type === 'acid_drip') {
            const pixelPos = this.gridToPixel(config.gridPosition.x, config.gridPosition.y);
            effect.acidPool = new AcidPool(pixelPos.x, pixelPos.y + this.gridSize, this.gridSize);
        } else if (config.type === 'crumbling_brick') {
            effect.crumblingBrick = new CrumblingBrickEffect(this.canvas, {
                gridPosition: config.gridPosition,
                intensity: config.intensity || 1.0,
                duration: config.duration || 3000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'big_explosion_combo') {
            effect.bigExplosion = new BigExplosionEffect(this.canvas, {
                intensity: config.intensity || 1.5,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'fairy_dust_combo') {
            effect.fairyDust = new FairyDustEffect(this.canvas, {
                intensity: config.intensity || 1.2,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'lightning_storm_combo') {
            effect.lightningStorm = new LightningStormEffect(this.canvas, {
                intensity: config.intensity || 1.3,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'lightning_bolt') {
            effect.lightningBolt = new LightningBoltEffect(this.canvas, {
                gridPosition: config.gridPosition,
                intensity: config.intensity || 1.0,
                duration: config.duration || 1800,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true,
                direction: 'horizontal'
            });
        } else if (config.type === 'multiply') {
            effect.multiply = new MultiplyEffect(this.canvas, {
                gridPosition: config.gridPosition,
                intensity: config.intensity || 1.0,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'teleport') {
            effect.teleport = new TeleportEffect(this.canvas, {
                gridPosition: config.gridPosition,
                intensity: config.intensity || 1.0,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'magnet') {
            effect.magnet = new MagnetEffect(this.canvas, {
                gridPosition: config.gridPosition,
                intensity: config.intensity || 1.0,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'transform') {
            effect.transform = new TransformEffect(this.canvas, {
                gridPosition: config.gridPosition,
                intensity: config.intensity || 1.0,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        } else if (config.type === 'heal') {
            effect.heal = new HealEffect(this.canvas, {
                gridPosition: config.gridPosition,
                intensity: config.intensity || 1.0,
                duration: config.duration || 2000,
                autoRemove: config.autoRemove !== undefined ? config.autoRemove : true
            });
        }

        this.effects.set(effectId, effect);
        return effectId;
    }

    /**
     * Remove an effect by ID
     */
    public removeEffect(effectId: string): void {
        this.effects.delete(effectId);
    }

    /**
     * Remove all effects at a specific grid position
     */
    public removeEffectsAt(gridPosition: Position): void {
        for (const [id, effect] of this.effects.entries()) {
            if (effect.gridPosition.x === gridPosition.x && 
                effect.gridPosition.y === gridPosition.y) {
                this.effects.delete(id);
            }
        }
    }

    /**
     * Stop an effect (prevent new particles, let existing ones finish)
     */
    public stopEffect(effectId: string): void {
        const effect = this.effects.get(effectId);
        if (effect) {
            effect.active = false;
        }
    }

    /**
     * Update all active effects
     */
    public update(deltaTime: number): void {
        for (const [id, effect] of this.effects.entries()) {
            this.updateEffect(effect, deltaTime);
            
            // Remove finished effects
            if (effect.autoRemove) {
                let isFinished = effect.elapsed >= effect.duration && effect.particles.length === 0;
                
                // Check if crumbling brick effect is finished
                if (effect.crumblingBrick) {
                    isFinished = effect.crumblingBrick.isFinished();
                }
                
                // Check if combo effects are finished
                if (effect.bigExplosion) {
                    isFinished = effect.bigExplosion.isFinished();
                }
                if (effect.fairyDust) {
                    isFinished = effect.fairyDust.isFinished();
                }
                if (effect.lightningStorm) {
                    isFinished = effect.lightningStorm.isFinished();
                }
                
                // Check if spell effects are finished
                if (effect.lightningBolt) {
                    isFinished = effect.lightningBolt.isFinished();
                }
                if (effect.multiply) {
                    isFinished = effect.multiply.isFinished();
                }
                if (effect.teleport) {
                    isFinished = effect.teleport.isFinished();
                }
                if (effect.magnet) {
                    isFinished = effect.magnet.isFinished();
                }
                if (effect.transform) {
                    isFinished = effect.transform.isFinished();
                }
                if (effect.heal) {
                    isFinished = effect.heal.isFinished();
                }
                
                if (isFinished) {
                    // Cleanup all effects
                    if (effect.crumblingBrick) {
                        effect.crumblingBrick.cleanup();
                    }
                    if (effect.bigExplosion) {
                        effect.bigExplosion.cleanup();
                    }
                    if (effect.fairyDust) {
                        effect.fairyDust.cleanup();
                    }
                    if (effect.lightningStorm) {
                        effect.lightningStorm.cleanup();
                    }
                    if (effect.lightningBolt) {
                        effect.lightningBolt.cleanup();
                    }
                    if (effect.multiply) {
                        effect.multiply.cleanup();
                    }
                    if (effect.teleport) {
                        effect.teleport.cleanup();
                    }
                    if (effect.magnet) {
                        effect.magnet.cleanup();
                    }
                    if (effect.transform) {
                        effect.transform.cleanup();
                    }
                    if (effect.heal) {
                        effect.heal.cleanup();
                    }
                    this.effects.delete(id);
                }
            }
        }
    }

    /**
     * Render all effects on the canvas
     */
    public render(): void {
        // Set blend mode for effects
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';

        for (const effect of this.effects.values()) {
            this.renderEffect(effect);
        }

        this.ctx.restore();
    }

    /**
     * Convert grid coordinates to pixel coordinates
     */
    private gridToPixel(gridX: number, gridY: number): Position {
        return {
            x: this.playfieldStartX + (gridX * this.gridSize),
            y: this.playfieldStartY + (gridY * this.gridSize)
        };
    }

    /**
     * Update a single effect
     */
    private updateEffect(effect: ActiveEffect, deltaTime: number): void {
        effect.elapsed += deltaTime;

        // Update acid pool if present
        if (effect.acidPool) {
            effect.acidPool.update();
        }
        
        // Update crumbling brick effect if present
        if (effect.crumblingBrick) {
            effect.crumblingBrick.update(deltaTime);
        }
        
        // Update combo effects if present
        if (effect.bigExplosion) {
            effect.bigExplosion.update(deltaTime);
        }
        if (effect.fairyDust) {
            effect.fairyDust.update(deltaTime);
        }
        if (effect.lightningStorm) {
            effect.lightningStorm.update(deltaTime);
        }
        
        // Update spell effects if present
        if (effect.lightningBolt) {
            effect.lightningBolt.update(deltaTime);
        }
        if (effect.multiply) {
            effect.multiply.update(deltaTime);
        }
        if (effect.teleport) {
            effect.teleport.update(deltaTime);
        }
        if (effect.magnet) {
            effect.magnet.update(deltaTime);
        }
        if (effect.transform) {
            effect.transform.update(deltaTime);
        }
        if (effect.heal) {
            effect.heal.update(deltaTime);
        }

        // Create new particles if effect is active
        if (effect.active && effect.elapsed < effect.duration) {
            this.createParticles(effect);
        }

        // Update existing particles
        for (let i = effect.particles.length - 1; i >= 0; i--) {
            effect.particles[i].update();
            if (effect.particles[i].isDead()) {
                // Add drop to acid pool if it's an acid drop
                if (effect.acidPool && effect.particles[i] instanceof AcidDrop) {
                    effect.acidPool.addDrop();
                }
                effect.particles.splice(i, 1);
            }
        }
    }

    /**
     * Render a single effect
     */
    private renderEffect(effect: ActiveEffect): void {
        // Render acid pool first (behind particles)
        if (effect.acidPool) {
            effect.acidPool.draw(this.ctx);
        }
        
        // Render crumbling brick effect
        if (effect.crumblingBrick) {
            effect.crumblingBrick.render();
        }
        
        // Render combo effects
        if (effect.bigExplosion) {
            effect.bigExplosion.render();
        }
        if (effect.fairyDust) {
            effect.fairyDust.render();
        }
        if (effect.lightningStorm) {
            effect.lightningStorm.render();
        }
        
        // Render spell effects
        if (effect.lightningBolt) {
            effect.lightningBolt.render();
        }
        if (effect.multiply) {
            effect.multiply.render();
        }
        if (effect.teleport) {
            effect.teleport.render();
        }
        if (effect.magnet) {
            effect.magnet.render();
        }
        if (effect.transform) {
            effect.transform.render();
        }
        if (effect.heal) {
            effect.heal.render();
        }

        // Render particles on top
        for (const particle of effect.particles) {
            particle.draw(this.ctx);
        }
    }

    /**
     * Create new particles for an effect based on its type
     */
    private createParticles(effect: ActiveEffect): void {
        const pixelPos = this.gridToPixel(effect.gridPosition.x, effect.gridPosition.y);
        
        switch (effect.type) {
            case 'acid_drip':
                this.createAcidParticles(effect, pixelPos);
                break;
            case 'flame':
                this.createFlameParticles(effect, pixelPos);
                break;
            case 'crumbling_brick':
                // Crumbling brick effect handles its own particles
                break;
            case 'big_explosion_combo':
            case 'fairy_dust_combo':
            case 'lightning_storm_combo':
                // Combo effects handle their own particles/rendering
                break;
            case 'lightning_bolt':
            case 'multiply':
            case 'teleport':
            case 'magnet':
            case 'transform':
            case 'heal':
                // Spell effects handle their own particles/rendering
                break;
            case 'explosion':
                this.createExplosionParticles(effect, pixelPos);
                break;
            case 'freeze':
                this.createFreezeParticles(effect, pixelPos);
                break;
            case 'lightning':
                this.createLightningParticles(effect, pixelPos);
                break;
        }
    }

    /**
     * Create acid drip particles
     */
    private createAcidParticles(effect: ActiveEffect, pixelPos: Position): void {
        const dropCount = Math.floor(2 * effect.intensity); // Reduced from 3 to 2
        for (let i = 0; i < dropCount; i++) {
            if (Math.random() < 0.5) { // Reduced from 70% to 50% chance
                const x = pixelPos.x + (this.gridSize / 2) + (Math.random() - 0.5) * (this.gridSize * 0.8);
                const y = pixelPos.y; // Start from top of block
                effect.particles.push(new AcidDrop(x, y));
            }
        }

        // Create bubbles in the acid pool if it exists and has some level
        if (effect.acidPool && effect.acidPool.getLevel() > 5 && Math.random() < 0.15) { // Reduced from 30% to 15%
            const bubbleX = pixelPos.x + (this.gridSize / 2) + (Math.random() - 0.5) * this.gridSize;
            const bubbleY = pixelPos.y + this.gridSize - effect.acidPool.getLevel() + Math.random() * 20;
            effect.particles.push(new AcidBubble(bubbleX, bubbleY));
        }
    }

    private createFlameParticles(effect: ActiveEffect, pixelPos: Position): void {
        const flameCount = Math.floor(5 * effect.intensity);
        for (let i = 0; i < flameCount; i++) {
            const x = pixelPos.x + (this.gridSize / 2) + (Math.random() - 0.5) * (this.gridSize * 0.8);
            const y = pixelPos.y + this.gridSize - 10; // Start from bottom of block
            effect.particles.push(new FlameParticle(x, y, effect.intensity));
        }
    }

    private createCrumbleParticles(effect: ActiveEffect, pixelPos: Position): void {
        // Will implement crumbling particles here
    }

    private createExplosionParticles(effect: ActiveEffect, pixelPos: Position): void {
        // Will implement explosion particles here
    }

    private createFreezeParticles(effect: ActiveEffect, pixelPos: Position): void {
        // Will implement freeze particles here
    }

    private createLightningParticles(effect: ActiveEffect, pixelPos: Position): void {
        // Will implement lightning particles here
    }

    /**
     * Add a combo effect (full-screen animation)
     */
    public addComboEffect(comboLevel: number, intensity: number = 1.0): string {
        let effectType: EffectType;
        
        // Choose effect based on combo level
        switch (comboLevel % 3) {
            case 0:
                effectType = 'big_explosion_combo';
                break;
            case 1:
                effectType = 'fairy_dust_combo';
                break;
            case 2:
                effectType = 'lightning_storm_combo';
                break;
            default:
                effectType = 'big_explosion_combo';
        }
        
        return this.addEffect({
            type: effectType,
            gridPosition: { x: 0, y: 0 }, // Not used for full-screen effects
            intensity: intensity + (comboLevel * 0.2),
            duration: 2000,
            autoRemove: true
        });
    }

    /**
     * Get all active effects at a grid position
     */
    public getEffectsAt(gridPosition: Position): ActiveEffect[] {
        return Array.from(this.effects.values()).filter(effect => 
            effect.gridPosition.x === gridPosition.x && 
            effect.gridPosition.y === gridPosition.y
        );
    }

    /**
     * Check if any effects are active at a position
     */
    public hasEffectsAt(gridPosition: Position): boolean {
        return this.getEffectsAt(gridPosition).length > 0;
    }

    /**
     * Clear all effects
     */
    public clear(): void {
        this.effects.clear();
    }

    /**
     * Get total number of active effects
     */
    public getEffectCount(): number {
        return this.effects.size;
    }

    /**
     * Get total number of particles across all effects
     */
    public getParticleCount(): number {
        let total = 0;
        for (const effect of this.effects.values()) {
            total += effect.particles.length;
        }
        return total;
    }
}