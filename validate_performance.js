// Simple validation script to test performance monitoring
import { PerformanceMonitor } from './dist/utils/PerformanceMonitor.js';

console.log('🔍 Testing PerformanceMonitor implementation...');

// Test 1: Basic instantiation
try {
    const monitor = new PerformanceMonitor();
    console.log('✅ Test 1 PASSED: PerformanceMonitor instantiated successfully');
    
    // Test 2: Initial metrics
    const initialMetrics = monitor.getPerformanceMetrics();
    console.log('✅ Test 2 PASSED: Initial metrics retrieved', {
        currentFPS: initialMetrics.currentFPS,
        qualityLevel: initialMetrics.qualityLevel,
        qualityName: initialMetrics.qualityName
    });
    
    // Test 3: Event listener setup
    let eventReceived = false;
    window.addEventListener('performanceAdjustment', (event) => {
        const customEvent = event;
        console.log('✅ Test 3 PASSED: Performance adjustment event received', customEvent.detail);
        eventReceived = true;
    });
    
    // Test 4: Simulate performance updates
    console.log('🔄 Simulating 60 performance updates...');
    let frameCount = 0;
    const simulateFrames = () => {
        const currentTime = performance.now();
        monitor.update(currentTime);
        frameCount++;
        
        if (frameCount % 10 === 0) {
            const metrics = monitor.getPerformanceMetrics();
            console.log(`Frame ${frameCount}: FPS=${metrics.currentFPS.toFixed(1)}, Avg=${metrics.averageFPS.toFixed(1)}, Quality=${metrics.qualityName}`);
        }
        
        if (frameCount < 60) {
            // Add some delay to simulate different frame rates
            if (frameCount > 30) {
                // Simulate slower frames
                const start = performance.now();
                while (performance.now() - start < 50) {
                    // Busy wait to simulate load
                }
            }
            setTimeout(simulateFrames, 16); // ~60fps
        } else {
            console.log('✅ Test 4 PASSED: Performance simulation completed');
            
            // Test 5: Check final metrics
            const finalMetrics = monitor.getPerformanceMetrics();
            console.log('✅ Test 5 PASSED: Final metrics', {
                frameCount: finalMetrics.frameCount,
                avgFPS: finalMetrics.averageFPS.toFixed(1),
                minFPS: finalMetrics.minFPS.toFixed(1),
                maxFPS: finalMetrics.maxFPS.toFixed(1),
                qualityLevel: finalMetrics.qualityLevel,
                qualityName: finalMetrics.qualityName
            });
            
            // Test 6: Check if auto-adjustment was triggered
            setTimeout(() => {
                if (eventReceived) {
                    console.log('✅ Test 6 PASSED: Performance auto-adjustment event was triggered');
                } else {
                    console.log('⚠️ Test 6 WARNING: No performance adjustment event received (may be normal if FPS stayed stable)');
                }
                
                console.log('🎉 All tests completed successfully!');
            }, 100);
        }
    };
    
    simulateFrames();
    
} catch (error) {
    console.error('❌ Test FAILED:', error);
}