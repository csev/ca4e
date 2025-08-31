/**
 * Pure JavaScript WAT to WASM Compiler - ES Module Version
 * 
 * This version uses ES modules and can be loaded directly in the browser
 * without requiring package.json or build tools.
 */

let wabtPromise = null;

async function getWabt() {
    if (!wabtPromise) {
        wabtPromise = import('https://esm.sh/wabt@1.0.37').then(mod => mod.default());
    }
    return wabtPromise;
}

class WatCompilerESM {
    async compileWatToWasm(watText) {
        try {
            const wabt = await getWabt();
            const module = wabt.parseWat('module.wat', watText);
            const { buffer } = module.toBinary({});
            return new Uint8Array(buffer);
        } catch (error) {
            throw new Error('WAT compilation failed: ' + error.message);
        }
    }
    async validateWat(watText) {
        try {
            const wabt = await getWabt();
            wabt.parseWat('module.wat', watText);
            return true;
        } catch (error) {
            throw new Error('WAT validation failed: ' + error.message);
        }
    }
}

export default WatCompilerESM; 