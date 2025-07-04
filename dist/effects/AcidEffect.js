export class AcidDrop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = Math.random() * 2 + 1;
        this.size = Math.random() * 8 + 4;
        this.life = 1.0;
        this.decay = Math.random() * 0.008 + 0.005; // Faster decay for performance
        this.acidity = Math.random() * 0.5 + 0.5;
        this.viscosity = 1.0;
        this.trail = [];
        this.maxTrailLength = 8;
    }
    update() {
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y, size: this.size * 0.8 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        // Physics with viscosity
        this.vy += 0.15 / this.viscosity; // gravity affected by viscosity
        this.x += this.vx / this.viscosity;
        this.y += this.vy / this.viscosity;
        // Air resistance
        this.vx *= 0.99;
        this.vy *= 0.998;
        // Add some randomness for realistic dripping
        this.vx += (Math.random() - 0.5) * 0.1;
        // Slight size variation for bubbling effect (keep minimum size)
        this.size = Math.max(this.size + Math.sin(Date.now() * 0.01 + this.x) * 0.2, 1);
        this.life -= this.decay;
    }
    draw(ctx) {
        if (this.life <= 0)
            return;
        const alpha = this.life;
        const brightness = this.acidity * this.life;
        // Draw trail first
        this.trail.forEach((point, index) => {
            const trailAlpha = (index / this.trail.length) * alpha * 0.2;
            const trailBrightness = brightness * (index / this.trail.length);
            ctx.save();
            ctx.globalAlpha = trailAlpha;
            ctx.fillStyle = `rgb(${Math.floor(trailBrightness * 100)}, ${Math.floor(255 * trailBrightness)}, ${Math.floor(trailBrightness * 50)})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgb(0, ${Math.floor(255 * trailBrightness)}, 0)`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        // Draw main drop
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        // Create gradient for 3D effect (ensure positive radius)
        const radius = Math.max(this.size, 1);
        const gradient = ctx.createRadialGradient(this.x - radius * 0.3, this.y - radius * 0.3, 0, this.x, this.y, radius);
        const r = Math.floor(brightness * 150);
        const g = Math.floor(255 * brightness);
        const b = Math.floor(brightness * 100);
        gradient.addColorStop(0, `rgba(${r + 50}, ${g}, ${b + 30}, 1)`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.9)`);
        gradient.addColorStop(1, `rgba(${r - 30}, ${g - 50}, ${b - 20}, 0.6)`);
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgb(0, ${g}, 0)`;
        // Draw drop shape (slightly elongated) - ensure positive size
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, radius, radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Add highlight for glossy effect - ensure positive highlight size
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.beginPath();
        const highlightRadius = Math.max(radius * 0.3, 0.5);
        ctx.ellipse(this.x - radius * 0.3, this.y - radius * 0.4, highlightRadius, Math.max(radius * 0.2, 0.3), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    isDead() {
        return this.life <= 0 || this.y > 800; // Adjust max Y for game bounds
    }
    setViscosity(viscosity) {
        this.viscosity = viscosity;
    }
}
export class AcidBubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.life = Math.random() * 2 + 1;
        this.maxLife = this.life;
        this.speed = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.5 + 0.3;
    }
    update() {
        this.y -= this.speed;
        this.life -= 0.02;
        this.size += 0.05;
    }
    draw(ctx) {
        if (this.life <= 0)
            return;
        const alpha = (this.life / this.maxLife) * this.opacity * 0.6;
        const brightness = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgb(0, ${Math.floor(255 * brightness)}, 0)`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 5;
        ctx.shadowColor = `rgb(0, ${Math.floor(255 * brightness)}, 0)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    isDead() {
        return this.life <= 0;
    }
}
export class AcidPool {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.level = 0;
        this.maxLevel = 50;
    }
    addDrop() {
        if (this.level < this.maxLevel) {
            this.level += 0.5;
        }
    }
    update() {
        // Slowly evaporate pool
        if (this.level > 0) {
            this.level -= 0.05;
        }
    }
    draw(ctx) {
        if (this.level <= 0)
            return;
        const poolY = this.y - this.level;
        const gradient = ctx.createLinearGradient(0, poolY, 0, this.y);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 150, 0, 0.5)');
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgb(0, 255, 0)';
        ctx.fillRect(this.x, poolY, this.width, this.level);
        // Add surface ripples
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = this.x; x < this.x + this.width; x += 10) {
            const wave = Math.sin((x + Date.now() * 0.005) * 0.05) * 2;
            ctx.lineTo(x, poolY + wave);
        }
        ctx.stroke();
        ctx.restore();
    }
    getLevel() {
        return this.level;
    }
}
//# sourceMappingURL=AcidEffect.js.map