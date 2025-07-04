export class HealEffect {
    constructor(canvas, options) {
        this.healingSparkles = [];
        this.restorationWaves = [];
        this.lifeSpirals = [];
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
        this.initializeHealEffect();
    }
    initializeHealEffect() {
        const centerPixel = this.gridToPixel(this.gridX, this.gridY);
        // Create initial restoration waves
        this.createRestorationWave(centerPixel.x, centerPixel.y);
        setTimeout(() => this.createRestorationWave(centerPixel.x, centerPixel.y), 400);
        // Create healing sparkles
        this.createHealingSparkles(centerPixel.x, centerPixel.y);
        // Create life spirals
        this.createLifeSpiral(centerPixel.x, centerPixel.y);
    }
    createRestorationWave(x, y) {
        this.restorationWaves.push({
            x,
            y,
            radius: 0,
            maxRadius: 60 + this.intensity * 25,
            life: 1.0,
            decay: 0.004,
            pulsePhase: 0,
            pulseSpeed: 0.1
        });
    }
    createHealingSparkles(centerX, centerY) {
        const sparkleCount = 18 + Math.floor(this.intensity * 15);
        for (let i = 0; i < sparkleCount; i++) {
            // Create sparkles in a gentle upward flow
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6; // Mostly upward
            const speed = 1 + Math.random() * 3;
            const distance = Math.random() * 40;
            const startX = centerX + (Math.random() - 0.5) * distance;
            const startY = centerY + (Math.random() - 0.5) * distance;
            this.healingSparkles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.003 + Math.random() * 0.002,
                size: 1 + Math.random() * 3,
                brightness: 0.7 + Math.random() * 0.3,
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.08 + Math.random() * 0.06
            });
        }
    }
    createLifeSpiral(centerX, centerY) {
        this.lifeSpirals.push({
            centerX,
            centerY,
            radius: 15,
            angle: 0,
            angularVelocity: 0.05,
            life: 1.0,
            decay: 0.002,
            points: []
        });
    }
    gridToPixel(gridX, gridY) {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }
    updateHealingSparkle(sparkle) {
        sparkle.x += sparkle.vx;
        sparkle.y += sparkle.vy;
        // Gentle floating motion
        sparkle.vy -= 0.02; // Light anti-gravity
        sparkle.vx *= 0.995; // Slight air resistance
        sparkle.vy *= 0.995;
        // Add gentle swaying
        sparkle.twinklePhase += sparkle.twinkleSpeed;
        sparkle.x += Math.sin(sparkle.twinklePhase) * 0.2;
        sparkle.life -= sparkle.decay;
        sparkle.size *= 0.998;
    }
    updateRestorationWave(wave) {
        wave.radius += 1.2;
        wave.pulsePhase += wave.pulseSpeed;
        wave.life -= wave.decay;
        if (wave.radius >= wave.maxRadius) {
            wave.life = Math.min(wave.life, 0.3);
        }
    }
    updateLifeSpiral(spiral) {
        spiral.angle += spiral.angularVelocity;
        spiral.radius += 0.3;
        // Add new point to spiral
        const x = spiral.centerX + Math.cos(spiral.angle) * spiral.radius;
        const y = spiral.centerY + Math.sin(spiral.angle) * spiral.radius;
        spiral.points.push({ x, y, life: 1.0 });
        // Update existing points
        for (let i = spiral.points.length - 1; i >= 0; i--) {
            spiral.points[i].life -= 0.015;
            if (spiral.points[i].life <= 0) {
                spiral.points.splice(i, 1);
            }
        }
        spiral.life -= spiral.decay;
    }
    drawHealingSparkle(sparkle) {
        if (sparkle.life <= 0)
            return;
        this.ctx.save();
        const twinkle = 0.5 + 0.5 * Math.sin(sparkle.twinklePhase);
        this.ctx.globalAlpha = sparkle.life * sparkle.brightness * (0.4 + 0.2 * twinkle);
        // Use green healing colors
        const greenIntensity = Math.floor(120 + 135 * twinkle);
        this.ctx.fillStyle = `rgb(60, ${greenIntensity}, 60)`;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = this.ctx.fillStyle;
        // Draw plus sign for healing symbol
        const size = sparkle.size * (0.8 + 0.4 * twinkle);
        this.ctx.translate(sparkle.x, sparkle.y);
        // Horizontal bar
        this.ctx.fillRect(-size, -size * 0.3, size * 2, size * 0.6);
        // Vertical bar
        this.ctx.fillRect(-size * 0.3, -size, size * 0.6, size * 2);
        // Add bright center
        this.ctx.globalAlpha = sparkle.life * twinkle * 0.6;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
        this.ctx.restore();
    }
    drawRestorationWave(wave) {
        if (wave.life <= 0)
            return;
        this.ctx.save();
        const pulse = 0.7 + 0.3 * Math.sin(wave.pulsePhase);
        this.ctx.globalAlpha = wave.life * pulse * 0.6;
        // Create healing gradient
        const gradient = this.ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, wave.radius);
        gradient.addColorStop(0, 'rgba(100, 255, 100, 0.4)');
        gradient.addColorStop(0.5, 'rgba(60, 200, 60, 0.2)');
        gradient.addColorStop(1, 'rgba(60, 150, 60, 0.05)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        this.ctx.fill();
        // Add gentle ring outline
        this.ctx.globalAlpha = wave.life * 0.5;
        this.ctx.strokeStyle = '#80FF80';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = '#80FF80';
        this.ctx.beginPath();
        this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawLifeSpiral(spiral) {
        if (spiral.life <= 0 || spiral.points.length < 2)
            return;
        this.ctx.save();
        this.ctx.globalAlpha = spiral.life * 0.7;
        this.ctx.strokeStyle = '#40FF40';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = '#40FF40';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        // Draw spiral path
        this.ctx.beginPath();
        spiral.points.forEach((point, index) => {
            if (point.life > 0) {
                this.ctx.globalAlpha = spiral.life * point.life * 0.7;
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                }
                else {
                    this.ctx.lineTo(point.x, point.y);
                }
            }
        });
        this.ctx.stroke();
        // Draw glowing dots along the spiral
        spiral.points.forEach((point, index) => {
            if (point.life > 0 && index % 3 === 0) {
                this.ctx.globalAlpha = spiral.life * point.life * 0.7;
                this.ctx.fillStyle = '#80FF80';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.restore();
    }
    update(deltaTime) {
        // Removed continuous particle creation for better performance
        // Update healing sparkles
        for (let i = this.healingSparkles.length - 1; i >= 0; i--) {
            this.updateHealingSparkle(this.healingSparkles[i]);
            if (this.healingSparkles[i].life <= 0) {
                this.healingSparkles.splice(i, 1);
            }
        }
        // Update restoration waves
        for (let i = this.restorationWaves.length - 1; i >= 0; i--) {
            this.updateRestorationWave(this.restorationWaves[i]);
            if (this.restorationWaves[i].life <= 0) {
                this.restorationWaves.splice(i, 1);
            }
        }
        // Update life spirals
        for (let i = this.lifeSpirals.length - 1; i >= 0; i--) {
            this.updateLifeSpiral(this.lifeSpirals[i]);
            if (this.lifeSpirals[i].life <= 0) {
                this.lifeSpirals.splice(i, 1);
            }
        }
        // Check if effect is complete
        const elapsedTime = Date.now() - this.startTime;
        if (elapsedTime > this.duration &&
            this.healingSparkles.length === 0 &&
            this.restorationWaves.length === 0 &&
            this.lifeSpirals.length === 0) {
            this.isComplete = true;
        }
    }
    render() {
        // Draw restoration waves first (background)
        this.restorationWaves.forEach(wave => {
            this.drawRestorationWave(wave);
        });
        // Draw life spirals
        this.lifeSpirals.forEach(spiral => {
            this.drawLifeSpiral(spiral);
        });
        // Draw healing sparkles on top
        this.healingSparkles.forEach(sparkle => {
            this.drawHealingSparkle(sparkle);
        });
    }
    isFinished() {
        if (!this.autoRemove)
            return false;
        return this.isComplete;
    }
    cleanup() {
        this.healingSparkles = [];
        this.restorationWaves = [];
        this.lifeSpirals = [];
    }
}
//# sourceMappingURL=HealEffect.js.map