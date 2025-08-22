export class Tween {
    private startTime: number = 0;
    private startValue: number;
    private endValue: number;
    private duration: number;
    private easingFunction: (t: number) => number;
    private isActive: boolean = false;
    private onComplete?: () => void;
    
    constructor(
        startValue: number,
        endValue: number,
        duration: number,
        easingFunction: (t: number) => number = Tween.easeInOut,
        onComplete?: () => void
    ) {
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.easingFunction = easingFunction;
        this.onComplete = onComplete;
    }
    
    public start(): void {
        this.startTime = Date.now();
        this.isActive = true;
    }
    
    public stop(): void {
        this.isActive = false;
    }
    
    public update(): number {
        if (!this.isActive) return this.endValue;
        
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        if (progress >= 1) {
            this.isActive = false;
            if (this.onComplete) {
                this.onComplete();
            }
            return this.endValue;
        }
        
        const easedProgress = this.easingFunction(progress);
        return this.startValue + (this.endValue - this.startValue) * easedProgress;
    }
    
    public isFinished(): boolean {
        return !this.isActive;
    }
    
    // Easing functions
    static linear(t: number): number {
        return t;
    }
    
    static easeIn(t: number): number {
        return t * t;
    }
    
    static easeOut(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }
    
    static easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    static easeInQuart(t: number): number {
        return t * t * t * t;
    }
    
    static easeOutQuart(t: number): number {
        return 1 - Math.pow(1 - t, 4);
    }
    
    static easeInOutQuart(t: number): number {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }
    
    static bounce(t: number): number {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
}

export class TweenManager {
    private tweens: Map<string, Tween> = new Map();
    
    public addTween(id: string, tween: Tween): void {
        this.tweens.set(id, tween);
        tween.start();
    }
    
    public removeTween(id: string): void {
        this.tweens.delete(id);
    }
    
    public getTween(id: string): Tween | undefined {
        return this.tweens.get(id);
    }
    
    public updateAll(): Map<string, number> {
        const values = new Map<string, number>();
        
        for (const [id, tween] of this.tweens) {
            const value = tween.update();
            values.set(id, value);
            
            if (tween.isFinished()) {
                this.tweens.delete(id);
            }
        }
        
        return values;
    }
    
    public clear(): void {
        this.tweens.clear();
    }
    
    public getActiveTweenCount(): number {
        return this.tweens.size;
    }
}