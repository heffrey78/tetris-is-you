export class FlameParticle {
    constructor(x, y, intensity = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2 * intensity;
        this.vy = -Math.random() * 3 - 1;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 4 + 2;
        this.heat = Math.random() * 0.5 + 0.5;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy -= 0.1; // gravity effect upward
        this.vx *= 0.99; // air resistance
        this.life -= this.decay;
        this.size *= 0.98;
        // Add some turbulence
        this.vx += (Math.random() - 0.5) * 0.2;
        this.vy += (Math.random() - 0.5) * 0.1;
    }
    draw(ctx) {
        if (this.life <= 0)
            return;
        const alpha = this.life;
        const temp = this.heat * this.life;
        // Create flame color gradient based on temperature
        let r, g, b;
        if (temp > 0.7) {
            // Hot: white/yellow
            r = 255;
            g = 255;
            b = Math.floor(100 + temp * 155);
        }
        else if (temp > 0.4) {
            // Medium: orange/yellow
            r = 255;
            g = Math.floor(100 + temp * 155);
            b = 0;
        }
        else {
            // Cool: red/orange
            r = 255;
            g = Math.floor(temp * 100);
            b = 0;
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    isDead() {
        return this.life <= 0;
    }
}
//# sourceMappingURL=FlameEffect.js.map