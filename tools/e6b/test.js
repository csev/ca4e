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
            // Log inputs for debugging
            console.log(`🔍 Inputs for ${testName}:`, {
                trueCourse: inputs.trueCourse + '°',
                trueAirspeed: inputs.trueAirspeed + ' kts',
                windFromDirection: inputs.windFromDirection + '°',
                windSpeed: inputs.windSpeed + ' kts'
            });
            
            const results = this.calculator.performCalculation(inputs);
            
            // Round results to match expected format
            const actualWca = Math.round(results.wca);
            const actualGroundSpeed = Math.round(results.groundSpeed);
            const actualHeading = Math.round(results.heading);
            const actualWindAngle = Math.round(results.windAngle);
            
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
                    heading: actualHeading,
                    windAngle: actualWindAngle
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
        
        // Always show inputs for debugging
        console.log(`  Inputs:   TC=${testResult.inputs.trueCourse}°, TAS=${testResult.inputs.trueAirspeed} kts, WFD=${testResult.inputs.windFromDirection}°, WS=${testResult.inputs.windSpeed} kts`);
        
        if (!testResult.passed) {
            if (testResult.error) {
                console.log(`  Error: ${testResult.error}`);
            } else {
                console.log(`  Expected: WCA=${testResult.expected.wca}, GS=${testResult.expected.groundSpeed}, HDG=${testResult.expected.heading}`);
                console.log(`  Actual:   WCA=${testResult.actual.wca}, GS=${testResult.actual.groundSpeed}, HDG=${testResult.actual.heading}, WA=${testResult.actual.windAngle}°`);
            }
        } else {
            // Show actual results even for passed tests
            console.log(`  Results:  WCA=${testResult.actual.wca}, GS=${testResult.actual.groundSpeed}, HDG=${testResult.actual.heading}, WA=${testResult.actual.windAngle}°`);
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
            { windFromDirection: 0, expectedWca: 0, expectedGs: 85 },
            { windFromDirection: 30, expectedWca: 4, expectedGs: 87 },
            { windFromDirection: 40, expectedWca: 6, expectedGs: 88 },
            { windFromDirection: 45, expectedWca: 6, expectedGs: 89 },
            { windFromDirection: 60, expectedWca: 7, expectedGs: 92 },
            { windFromDirection: 90, expectedWca: 9, expectedGs: 99 },
            { windFromDirection: 120, expectedWca: 7, expectedGs: 107 },
            { windFromDirection: 135, expectedWca: 6, expectedGs: 110 },
            { windFromDirection: 180, expectedWca: 0, expectedGs: 115 },
            { windFromDirection: 220, expectedWca: -6, expectedGs: 111 },
            { windFromDirection: 225, expectedWca: -6, expectedGs: 110 },
            { windFromDirection: 270, expectedWca: -9, expectedGs: 99 },
            { windFromDirection: 360, expectedWca: 0, expectedGs: 85 }
        ];

        testCases.forEach((testCase, index) => {
            // Convert wind angle to wind from direction
            
            const inputs = {
                trueCourse: 0,
                trueAirspeed: 100,
                windFromDirection: testCase.windFromDirection,
                windSpeed: 15
            };
            
            const expectedResults = {
                wca: testCase.expectedWca,
                groundSpeed: testCase.expectedGs,
                heading: (0 + testCase.expectedWca + 360) % 360
            };
            
            this.runTest(`Wind Direction ${testCase.windFromDirection}°`, inputs, expectedResults);
        });
        
        console.log('');
    }

    // Edge cases and boundary conditions
    runEdgeCases() {
        console.log('🔍 Edge Cases:');
        
        // Zero wind speed
        this.runTest('Zero Wind Speed', 
            { trueCourse: 90, trueAirspeed: 100, windFromDirection: 180, windSpeed: 0 },
            { wca: 0, groundSpeed: 100, heading: 90 }
        );
        
        // Very high wind speed
        this.runTest('High Wind Speed', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 90, windSpeed: 80 },
            { wca: 53, groundSpeed: 60, heading: 53 }
        );
        
        // Headwind case
        this.runTest('Headwind', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 0, windSpeed:15 },
            { wca: 0, groundSpeed: 85, heading: 0 }
        );
        
        // Tailwind case
        this.runTest('Tailwind', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 180, windSpeed: 15 },
            { wca: 0, groundSpeed: 115, heading: 0 }
        );
        
        console.log('');
    }

    // Special cases
    runSpecialCases() {
        console.log('⭐ Special Cases:');

        // Note windDirection is the "from" direction, not the "to" direction
        
        // Crosswind from right
        this.runTest('Crosswind Right', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 90, windSpeed: 15 },
            { wca: 9, groundSpeed: 99, heading: 9 }
        );
        
        // Crosswind from left
        this.runTest('Crosswind Left', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 270, windSpeed: 15 },
            { wca: -9, groundSpeed: 99, heading: 351 }
        );
        
        // 45-degree wind from right (headwind component)
        this.runTest('45° Headwind Right', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 45, windSpeed: 15 },
            { wca: 6, groundSpeed: 89, heading: 6 }
        );
        
        // 45-degree wind from left
        this.runTest('315° Headwind Left', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 315, windSpeed: 15 },
            { wca: -6, groundSpeed: 89, heading: 354 }
        );

        // 135-degree wind from right (matching provided test case)
        this.runTest('135° Tailwind Right', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 135, windSpeed: 15 },
            { wca: 6, groundSpeed: 110, heading: 6 }
        );
        
        // 225-degree wind from left
        this.runTest('225° Tailwind Left', 
            { trueCourse: 0, trueAirspeed: 100, windFromDirection: 225, windSpeed: 15 },
            { wca: -6, groundSpeed: 110, heading: 354 }
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