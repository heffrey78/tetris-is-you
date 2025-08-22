/**
 * PerformanceMonitor - Simple performance tracking utility
 * 
 * Provides basic performance metrics for audio system monitoring
 */

export interface PerformanceMetrics {
    /** Memory usage in MB */
    memoryUsage: number;
    /** CPU usage percentage estimate */
    cpuUsage: number;
    /** Frame rate for visual elements */
    frameRate: number;
    /** Timestamp of last measurement */
    timestamp: number;
}

/**
 * Basic performance monitoring utility
 */
export class PerformanceMonitor {
    private lastTimestamp: number = 0;
    private frameCount: number = 0;
    private lastFrameRate: number = 60;
    
    constructor() {
        this.lastTimestamp = performance.now();
    }
    
    /**
     * Get current performance metrics
     */
    public getPerformanceMetrics(): PerformanceMetrics {
        const now = performance.now();
        const deltaTime = now - this.lastTimestamp;
        
        // Simple frame rate calculation
        this.frameCount++;
        if (deltaTime >= 1000) {
            this.lastFrameRate = this.frameCount;
            this.frameCount = 0;
            this.lastTimestamp = now;
        }
        
        return {
            memoryUsage: this.getMemoryUsage(),
            cpuUsage: this.getCPUUsage(),
            frameRate: this.lastFrameRate,
            timestamp: now
        };
    }
    
    /**
     * Get estimated memory usage in MB
     */
    private getMemoryUsage(): number {
        try {
            // Use performance.memory if available (Chrome)
            if ('memory' in performance) {
                const memory = (performance as any).memory;
                return Math.round(memory.usedJSHeapSize / (1024 * 1024));
            }
        } catch (error) {
            // Ignore errors
        }
        
        // Fallback estimate
        return 0;
    }
    
    /**
     * Get estimated CPU usage percentage
     */
    private getCPUUsage(): number {
        // Simple estimate based on frame rate
        const targetFrameRate = 60;
        const currentFrameRate = this.lastFrameRate;
        
        if (currentFrameRate >= targetFrameRate) {
            return 0; // Good performance
        } else {
            // Rough estimate of CPU load based on frame drops
            return Math.min(100, Math.round((targetFrameRate - currentFrameRate) / targetFrameRate * 100));
        }
    }
    
    /**
     * Update performance metrics with current timestamp
     * @param currentTime Current timestamp from requestAnimationFrame or similar
     */
    public update(currentTime: number): void {
        this.frameCount++;
        
        // Update frame rate calculation
        const deltaTime = currentTime - this.lastTimestamp;
        if (deltaTime >= 1000) { // Update every second
            this.lastFrameRate = (this.frameCount * 1000) / deltaTime;
            this.frameCount = 0;
            this.lastTimestamp = currentTime;
        }
    }
}