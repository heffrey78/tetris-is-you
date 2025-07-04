export class TransformEffect {
    constructor(canvas, options) {
        this.transformWaves = [];
        this.morphParticles = [];
        this.colorRipples = [];
        this.cellSize = 32;
        this.isComplete = false;
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Cannot get canvas context');
        this.ctx = ctx;
        this.gridX = options.gridPosition.x;
        this.gridY = options.gridPosition.y;
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.autoRemove = options.autoRemove;
        this.startTime = Date.now();
        this.initializeTransformEffect();
    }
    initializeTransformEffect() {
        const centerPixel = this.gridToPixel(this.gridX, this.gridY);
        // Create transform waves
        this.createTransformWave(centerPixel.x, centerPixel.y);
        setTimeout(() => this.createTransformWave(centerPixel.x, centerPixel.y), 300);
        setTimeout(() => this.createTransformWave(centerPixel.x, centerPixel.y), 600);
        // Create morph particles
        this.createMorphParticles(centerPixel.x, centerPixel.y);
        // Create color ripples
        this.createColorRipples(centerPixel.x, centerPixel.y);
    }
    createTransformWave(x, y) {
        this.transformWaves.push({
            x,
            y,
            radius: 0,
            maxRadius: 70 + this.intensity * 30,
            life: 1.0,
            decay: 0.005,
            colorPhase: Math.random() * Math.PI * 2,
            colorSpeed: 0.08 + Math.random() * 0.04
        });
    }
    createMorphParticles(centerX, centerY) {
        const particleCount = 15 + Math.floor(this.intensity * 10);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 60;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            this.morphParticles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 1.0,
                decay: 0.004 + Math.random() * 0.003,
                size: 2 + Math.random() * 4,
                colorPhase: Math.random() * Math.PI * 2,
                colorSpeed: 0.1 + Math.random() * 0.1,
                morphState: 0,
                morphSpeed: 0.05 + Math.random() * 0.05
            });
        }
    }
    createColorRipples(centerX, centerY) {
        const rippleCount = 3 + Math.floor(this.intensity);
        for (let i = 0; i < rippleCount; i++) {
            setTimeout(() => {
                this.colorRipples.push({
                    x: centerX + (Math.random() - 0.5) * 40,
                    y: centerY + (Math.random() - 0.5) * 40,
                    radius: 0,
                    maxRadius: 50 + Math.random() * 40,
                    life: 1.0,
                    decay: 0.006,
                    thickness: 2 + Math.random() * 3,
                    hue: Math.random() * 360
                });
            }, i * 200);
        }
    }
    gridToPixel(gridX, gridY) {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }
    updateTransformWave(wave) {
        wave.radius += 1.5;
        wave.colorPhase += wave.colorSpeed;
        wave.life -= wave.decay;
        if (wave.radius >= wave.maxRadius) {
            wave.life = Math.min(wave.life, 0.4);
        }
    }
    updateMorphParticle(particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        // Add swirling motion
        particle.morphState += particle.morphSpeed;
        particle.x += Math.sin(particle.morphState) * 0.5;
        particle.y += Math.cos(particle.morphState * 0.7) * 0.5;
        // Apply friction
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.colorPhase += particle.colorSpeed;
        particle.life -= particle.decay;
        particle.size *= 0.995;
    }
    updateColorRipple(ripple) {
        ripple.radius += 2;
        ripple.life -= ripple.decay;
        ripple.hue = (ripple.hue + 2) % 360; // Slowly shift hue
        if (ripple.radius >= ripple.maxRadius) {
            ripple.life = Math.min(ripple.life, 0.3);
        }
    }
    getColorFromPhase(phase, alpha = 1) {
        const hue = ((phase * 180 / Math.PI) + 180) % 360;
        return `hsla(${hue}, 80%, 60%, ${alpha})`;
    }
    drawTransformWave(wave) {
        if (wave.life <= 0)
            return;
        this.ctx.save();
        this.ctx.globalAlpha = wave.life * 0.7;
        // Create gradient that shifts through colors
        const gradient = this.ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, wave.radius);
        const innerColor = this.getColorFromPhase(wave.colorPhase, 0.8);
        const outerColor = this.getColorFromPhase(wave.colorPhase + Math.PI, 0.2);
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(0.5, this.getColorFromPhase(wave.colorPhase + Math.PI * 0.5, 0.5));
        gradient.addColorStop(1, outerColor);
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        this.ctx.fill();
        // Add shimmering ring
        this.ctx.globalAlpha = wave.life * 0.5;
        this.ctx.strokeStyle = this.getColorFromPhase(wave.colorPhase + Math.PI);
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.beginPath();
        this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawMorphParticle(particle) {
        if (particle.life <= 0)
            return;
        this.ctx.save();
        this.ctx.globalAlpha = particle.life * 0.7;
        const color = this.getColorFromPhase(particle.colorPhase);
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = color;
        // Draw morphing shape (circle to diamond to triangle)
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.morphState);
        const morphProgress = (Math.sin(particle.morphState * 2) + 1) / 2; // 0 to 1
        const size = particle.size;
        this.ctx.beginPath();
        if (morphProgress < 0.33) {
            // Circle
            this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        }
        else if (morphProgress < 0.66) {
            // Diamond
            this.ctx.moveTo(0, -size);
            this.ctx.lineTo(size, 0);
            this.ctx.lineTo(0, size);
            this.ctx.lineTo(-size, 0);
            this.ctx.closePath();
        }
        else {
            // Triangle
            this.ctx.moveTo(0, -size);
            this.ctx.lineTo(size * 0.866, size * 0.5);
            this.ctx.lineTo(-size * 0.866, size * 0.5);
            this.ctx.closePath();
        }
        this.ctx.fill();
        this.ctx.restore();
    }
    drawColorRipple(ripple) {
        if (ripple.life <= 0)
            return;
        this.ctx.save();
        this.ctx.globalAlpha = ripple.life * 0.7;
        this.ctx.strokeStyle = `hsl(${ripple.hue}, 70%, 50%)`;
        this.ctx.lineWidth = ripple.thickness;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    update(deltaTime) {
        // Update transform waves
        for (let i = this.transformWaves.length - 1; i >= 0; i--) {
            this.updateTransformWave(this.transformWaves[i]);
            if (this.transformWaves[i].life <= 0) {
                this.transformWaves.splice(i, 1);
            }
        }
        // Update morph particles
        for (let i = this.morphParticles.length - 1; i >= 0; i--) {
            this.updateMorphParticle(this.morphParticles[i]);
            if (this.morphParticles[i].life <= 0) {
                this.morphParticles.splice(i, 1);
            }
        }
        // Update color ripples
        for (let i = this.colorRipples.length - 1; i >= 0; i--) {
            this.updateColorRipple(this.colorRipples[i]);
            if (this.colorRipples[i].life <= 0) {
                this.colorRipples.splice(i, 1);
            }
        }
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration &&
            this.transformWaves.length === 0 &&
            this.morphParticles.length === 0 &&
            this.colorRipples.length === 0) {
            this.isComplete = true;
        }
    }
    render() {
        // Draw transform waves first (background)
        this.transformWaves.forEach(wave => {
            this.drawTransformWave(wave);
        });
        // Draw color ripples
        this.colorRipples.forEach(ripple => {
            this.drawColorRipple(ripple);
        });
        // Draw morph particles on top
        this.morphParticles.forEach(particle => {
            this.drawMorphParticle(particle);
        });
    }
    isFinished() {
        if (!this.autoRemove)
            return false;
        return this.isComplete;
    }
    cleanup() {
        this.transformWaves = [];
        this.morphParticles = [];
        this.colorRipples = [];
    }
}
//# sourceMappingURL=TransformEffect.js.map