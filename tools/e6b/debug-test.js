// Debug script for failing test cases
import { E6BWindCalculator } from "./script.js";

const calculator = new E6BWindCalculator();

// Test case 1: Wind Angle 225°
console.log("=== Debug Wind Angle 225° ===");
const inputs1 = {
    trueCourse: 0,
    trueAirspeed: 100,
    windDirection: 135, // 180 - 225 = -45, so 135
    windSpeed: 15
};

const results1 = calculator.performCalculation(inputs1);
console.log("Inputs:", inputs1);
console.log("Results:", results1);
console.log("Expected: WCA=-6, GS=110, HDG=354");
console.log("Actual:   WCA=" + Math.round(results1.wca) + ", GS=" + Math.round(results1.groundSpeed) + ", HDG=" + Math.round(results1.heading));

// Test case 2: Wind Angle 270°
console.log("\n=== Debug Wind Angle 270° ===");
const inputs2 = {
    trueCourse: 0,
    trueAirspeed: 100,
    windDirection: 90, // 180 - 270 = -90, so 90
    windSpeed: 15
};

const results2 = calculator.performCalculation(inputs2);
console.log("Inputs:", inputs2);
console.log("Results:", results2);
console.log("Expected: WCA=-9, GS=99, HDG=351");
console.log("Actual:   WCA=" + Math.round(results2.wca) + ", GS=" + Math.round(results2.groundSpeed) + ", HDG=" + Math.round(results2.heading)); 