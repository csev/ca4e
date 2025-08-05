// Deno test runner for E6B Wind Triangle Calculator
import { assertEquals, assertAlmostEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock DOM environment for Deno
globalThis.window = {
  document: {
    getElementById: () => ({
      value: "0",
      addEventListener: () => {},
      textContent: "",
      classList: {
        add: () => {},
        remove: () => {}
      }
    }),
    addEventListener: () => {}
  }
};

// Import the calculator class
import { E6BWindCalculator } from "./script.js";

// Test suite
Deno.test("E6B Wind Triangle Calculator Tests", async (t) => {
  const calculator = new E6BWindCalculator();

  // Helper function to run a test case
  const runTestCase = (testName, inputs, expectedResults) => {
    return t.step(testName, () => {
      const results = calculator.performCalculation(inputs);
      
      // Round results to match expected format
      const actualWca = Math.round(results.wca);
      const actualGroundSpeed = Math.round(results.groundSpeed);
      const actualHeading = Math.round(results.heading);
      const actualWindAngle = Math.round(results.windAngle);
      
      console.log(`${testName}: Wind Angle = ${actualWindAngle}°`);
      
      assertEquals(actualWca, expectedResults.wca, `WCA mismatch: expected ${expectedResults.wca}, got ${actualWca}`);
      assertEquals(actualGroundSpeed, expectedResults.groundSpeed, `Ground Speed mismatch: expected ${expectedResults.groundSpeed}, got ${actualGroundSpeed}`);
      assertEquals(actualHeading, expectedResults.heading, `Heading mismatch: expected ${expectedResults.heading}, got ${actualHeading}`);
    });
  };

  // Provided test cases
  const providedTestCases = [
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 0, expectedWca: 0, expectedGs: 85 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 30, expectedWca: 4, expectedGs: 87 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 60, expectedWca: 7, expectedGs: 92 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 90, expectedWca: 9, expectedGs: 99 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 120, expectedWca: 7, expectedGs: 107 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 135, expectedWca: 6, expectedGs: 110 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 180, expectedWca: 0, expectedGs: 115 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 225, expectedWca: -6, expectedGs: 110 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 270, expectedWca: -9, expectedGs: 99 },
    { trueCourse: 0, trueAirspeed: 100, windSpeed: 15, windAngle: 360, expectedWca: 0, expectedGs: 85 }
  ];

  // Run provided test cases
  for (const testCase of providedTestCases) {
    const windFromDirection = (180 - testCase.windAngle) % 360;
    const inputs = {
      trueCourse: testCase.trueCourse,
      trueAirspeed: testCase.trueAirspeed,
      windFromDirection: windFromDirection,
      windSpeed: testCase.windSpeed
    };
    const expectedResults = {
      wca: testCase.expectedWca,
      groundSpeed: testCase.expectedGs,
      heading: (testCase.trueCourse + testCase.expectedWca) % 360
    };
    
    await runTestCase(`Wind Angle ${testCase.windAngle}°`, inputs, expectedResults);
  }

  // Edge cases
  await runTestCase("Zero Wind Speed", 
    { trueCourse: 90, trueAirspeed: 100, windFromDirection: 180, windSpeed: 0 },
    { wca: 0, groundSpeed: 100, heading: 90 }
  );

  await runTestCase("Headwind", 
    { trueCourse: 0, trueAirspeed: 100, windFromDirection: 180, windSpeed: 20 },
    { wca: 0, groundSpeed: 80, heading: 0 }
  );

  await runTestCase("Tailwind", 
    { trueCourse: 0, trueAirspeed: 100, windFromDirection: 0, windSpeed: 20 },
    { wca: 0, groundSpeed: 120, heading: 0 }
  );

  await runTestCase("Crosswind Right", 
    { trueCourse: 0, trueAirspeed: 100, windFromDirection: 90, windSpeed: 20 },
    { wca: 12, groundSpeed: 98, heading: 12 }
  );

  await runTestCase("Crosswind Left", 
    { trueCourse: 0, trueAirspeed: 100, windFromDirection: 270, windSpeed: 20 },
    { wca: -12, groundSpeed: 98, heading: 348 }
  );
}); 