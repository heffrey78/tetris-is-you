// Browser console test script for performance monitoring validation
// Instructions: 
// 1. Open http://localhost:8000/test_game_integration.html in browser
// 2. Open browser console (F12)
// 3. Copy and paste this script into the console
// 4. Run the script

console.log('🚀 Starting comprehensive performance monitoring validation...');

// Test 1: Check if PerformanceMonitor module loads correctly
import('./dist/utils/PerformanceMonitor.js').then(module => {
    console.log('✅ PerformanceMonitor module imported successfully');
    
    const { PerformanceMonitor } = module;
    const monitor = new PerformanceMonitor();
    
    console.log('✅ PerformanceMonitor instantiated:', monitor);
    
    // Test 2: Check initial state
    const initialMetrics = monitor.getPerformanceMetrics();
    console.log('✅ Initial metrics:', initialMetrics);
    
    // Test 3: Listen for performance events
    let eventCount = 0;
    window.addEventListener('performanceAdjustment', (event) => {
        eventCount++;
        console.log(`✅ Performance adjustment event #${eventCount}:`, event.detail);
    });
    
    // Test 4: Simulate performance updates with varying loads
    let frameCount = 0;
    const maxFrames = 120; // 2 seconds at 60fps
    
    function simulateLoad(duration) {
        const start = performance.now();
        while (performance.now() - start < duration) {
            // Busy wait
        }
    }
    
    function testLoop() {
        const currentTime = performance.now();
        monitor.update(currentTime);
        frameCount++;
        
        // Simulate different performance scenarios
        if (frameCount < 30) {
            // Good performance - no load
            console.log(`Frame ${frameCount}: Normal performance`);
        } else if (frameCount < 60) {
            // Moderate load
            simulateLoad(20);
            if (frameCount % 10 === 0) console.log(`Frame ${frameCount}: Moderate load`);
        } else if (frameCount < 90) {
            // Heavy load to trigger adjustment
            simulateLoad(60);
            if (frameCount % 10 === 0) console.log(`Frame ${frameCount}: Heavy load`);
        } else {
            // Recovery
            simulateLoad(5);
            if (frameCount % 10 === 0) console.log(`Frame ${frameCount}: Recovery`);
        }
        
        if (frameCount % 20 === 0) {
            const metrics = monitor.getPerformanceMetrics();
            console.log(`📊 Metrics at frame ${frameCount}:`, {
                currentFPS: metrics.currentFPS.toFixed(1),
                averageFPS: metrics.averageFPS.toFixed(1),
                qualityLevel: metrics.qualityLevel,
                qualityName: metrics.qualityName
            });
        }
        
        if (frameCount < maxFrames) {
            requestAnimationFrame(testLoop);
        } else {
            // Final results
            const finalMetrics = monitor.getPerformanceMetrics();
            console.log('🎉 Test completed!');
            console.log('📊 Final metrics:', finalMetrics);
            console.log(`📈 Performance events triggered: ${eventCount}`);
            
            if (eventCount > 0) {
                console.log('✅ Performance auto-adjustment system is working correctly!');
            } else {
                console.log('⚠️ No performance adjustment events were triggered');
            }
        }
    }
    
    requestAnimationFrame(testLoop);
    
}).catch(error => {
    console.error('❌ Failed to import PerformanceMonitor:', error);
});

// Test 5: Check if Game class integrates performance monitoring
import('./dist/Game.js').then(module => {
    console.log('✅ Game module imported successfully');
    
    const { Game } = module;
    
    // Create a temporary canvas for testing
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 800;
    testCanvas.height = 600;
    
    const game = new Game(testCanvas);
    console.log('✅ Game instantiated with performance monitoring');
    
    const performanceMonitor = game.getPerformanceMonitor();
    if (performanceMonitor) {
        console.log('✅ Performance monitor accessible via game.getPerformanceMonitor()');
        console.log('📊 Performance monitor state:', performanceMonitor.getPerformanceMetrics());
    } else {
        console.error('❌ Performance monitor not accessible');
    }
    
}).catch(error => {
    console.error('❌ Failed to import Game:', error);
});

console.log('ℹ️ Tests are running asynchronously. Watch for results above.');