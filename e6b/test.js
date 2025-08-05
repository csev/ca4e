// Unit Tests for E6B Wind Triangle Calculator
import { E6BWindCalculator } from './script.js';

class E6BWindTriangleTests {
    constructor() {
        this.calculator = new E6BWindCalculator();
        this.testResults = [];
    }

    // Helper method to run a single test case
    runTest(testName, inputs, expectedResults) {
        try {
            const results = this.calculator.performCalculation(inputs);
            
            // Round results to match expected format
            const actualWca = Math.round(results.wca);
            const actualGroundSpeed = Math.round(results.groundSpeed);
            const actualHeading = Math.round(results.heading);
            
            // Check if results match expected values
            const wcaMatch = actualWca === expectedResults.wca;
            const groundSpeedMatch = actualGroundSpeed === expectedResults.groundSpeed;
            const headingMatch = actualHeading === expectedResults.heading;
            
            const passed = wcaMatch && groundSpeedMatch && headingMatch;
            
            const testResult = {
                name: testName,
                passed: passed,
                inputs: inputs,
                expected: expectedResults,
                actual: {
                    wca: actualWca,
                    groundSpeed: actualGroundSpeed,
                    heading: actualHeading
                },
                details: {
                    wcaMatch: wcaMatch,
                    groundSpeedMatch: groundSpeedMatch,
                    headingMatch: headingMatch
                }
            };
            
            this.testResults.push(testResult);
            this.logTestResult(testResult);
            
            return passed;
        } catch (error) {
            const testResult = {
                name: testName,
                passed: false,
                inputs: inputs,
                expected: expectedResults,
                error: error.message
            };
            
            this.testResults.push(testResult);
            this.logTestResult(testResult);
            return false;
        }
    }

    // Log test results
    logTestResult(testResult) {
        const status = testResult.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testResult.name}`);
        
        if (!testResult.passed) {
            if (testResult.error) {
                console.log(`  Error: ${testResult.error}`);
            } else {
                console.log(`  Expected: WCA=${testResult.expected.wca}, GS=${testResult.expected.groundSpeed}, HDG=${testResult.expected.heading}`);
                console.log(`  Actual:   WCA=${testResult.actual.wca}, GS=${testResult.actual.groundSpeed}, HDG=${testResult.actual.heading}`);
            }
        }
    }

    // Run all tests
    runAllTests() {
        console.log('🧪 Running E6B Wind Triangle Calculator Tests\n');
        
        this.runProvidedTestCases();
        this.runEdgeCases();
        this.runSpecialCases();
        
        this.printSummary();
    }

    // Test cases provided by user
    runProvidedTestCases() {
        console.log('📋 Provided Test Cases:');
        
        // Note windAngle is the "to" direction, not the "from" direction
        const testCases = [
            { windAngle: 0, expectedWca: 0, expectedGs: 85 },
            { windAngle: 30, expectedWca: 4, expectedGs: 87 },
            { windAngle: 40, expectedWca: 6, expectedGs: 88 },
            { windAngle: 45, expectedWca: 6, expectedGs: 89 },
            { windAngle: 60, expectedWca: 7, expectedGs: 92 },
            { windAngle: 90, expectedWca: 9, expectedGs: 99 },
            { windAngle: 120, expectedWca: 7, expectedGs: 107 },
            { windAngle: 135, expectedWca: 6, expectedGs: 110 },
            { windAngle: 180, expectedWca: 0, expectedGs: 115 },
            { windAngle: 220, expectedWca: -6, expectedGs: 111 },
            { windAngle: 225, expectedWca: -6, expectedGs: 110 },
            { windAngle: 270, expectedWca: -9, expectedGs: 99 },
            { windAngle: 360, expectedWca: 0, expectedGs: 85 }
        ];

        testCases.forEach((testCase, index) => {
            // Convert wind angle to wind direction (wind from direction)
            const windDirection = (180 - testCase.windAngle) % 360;
            
            const inputs = {
                trueCourse: 0,
                trueAirspeed: 100,
                windDirection: windDirection,
                windSpeed: 15
            };
            
            const expectedResults = {
                wca: testCase.expectedWca,
                groundSpeed: testCase.expectedGs,
                heading: (0 + testCase.expectedWca + 360) % 360
            };
            
            this.runTest(`Wind Angle ${testCase.windAngle}°`, inputs, expectedResults);
        });
        
        console.log('');
    }

    // Edge cases and boundary conditions
    runEdgeCases() {
        console.log('🔍 Edge Cases:');
        
        // Zero wind speed
        this.runTest('Zero Wind Speed', 
            { trueCourse: 90, trueAirspeed: 100, windDirection: 180, windSpeed: 0 },
            { wca: 0, groundSpeed: 100, heading: 90 }
        );
        
        // Very high wind speed
        this.runTest('High Wind Speed', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 90, windSpeed: 80 },
            { wca: 53, groundSpeed: 60, heading: 53 }
        );
        
        // Headwind case
        this.runTest('Headwind', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 180, windSpeed: 20 },
            { wca: 0, groundSpeed: 80, heading: 0 }
        );
        
        // Tailwind case
        this.runTest('Tailwind', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 0, windSpeed: 20 },
            { wca: 0, groundSpeed: 120, heading: 0 }
        );
        
        console.log('');
    }

    // Special cases
    runSpecialCases() {
        console.log('⭐ Special Cases:');

        // Note windDirection is the "from" direction, not the "to" direction
        
        // Crosswind from right
        this.runTest('Crosswind Right', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 90, windSpeed: 15 },
            { wca: 9, groundSpeed: 99, heading: 9 }
        );
        
        // Crosswind from left
        this.runTest('Crosswind Left', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 270, windSpeed: 15 },
            { wca: -9, groundSpeed: 99, heading: 351 }
        );
        
        // 45-degree wind from right (matching provided test case)
        this.runTest('45° Wind Right', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 135, windSpeed: 15 },
            { wca: 6, groundSpeed: 89, heading: 6 }
        );
        
        // 45-degree wind from left
        this.runTest('45° Wind Left', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 315, windSpeed: 15 },
            { wca: -6, groundSpeed: 89, heading: 354 }
        );

        // 135-degree wind from right (matching provided test case)
        this.runTest('135° Wind Right', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 325, windSpeed: 15 },
            { wca: 6, groundSpeed: 89, heading: 226 }
        );
        
        // 225-degree wind from left
        this.runTest('225° Wind Left', 
            { trueCourse: 0, trueAirspeed: 100, windDirection: 45, windSpeed: 15 },
            { wca: -6, groundSpeed: 89, heading: 226 }
        );
        
        console.log('');
    }

    // Print test summary
    printSummary() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log('📊 Test Summary:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`  - ${result.name}`);
                });
        }
    }
}

// Export for browser environment
export { E6BWindTriangleTests };

// Run tests when this file is loaded
if (typeof window !== 'undefined') {
    // Browser environment
    window.E6BWindTriangleTests = E6BWindTriangleTests;
    console.log('🧪 E6B Wind Triangle Tests loaded. Run: new E6BWindTriangleTests().runAllTests()');
} else {
    // Node.js environment
    const tests = new E6BWindTriangleTests();
    tests.runAllTests();
} 