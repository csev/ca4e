/**
 * CDC8512 CPU Emulator Module
 * Works with the existing CDC8512 web component
 */

class CDC8512Emulator {
    constructor(cpuComponent) {
        this.cpu = cpuComponent;
        this.running = false;
        this.clockInterval = null;
        this.clockSpeed = 500; // 0.5 Hz = 500ms
        this.output = '';
        this.executionTrace = [];
    }

    // Reset the CPU to initial state
    reset() {
        this.cpu.pc = 0;
        this.cpu.comparison = '=';
        this.cpu.mode = 0;
        this.cpu.a0 = 0;
        this.cpu.a1 = 0;
        this.cpu.a2 = 0;
        this.cpu.a3 = 0;
        this.cpu.x0 = 0;
        this.cpu.x1 = 0;
        this.cpu.x2 = 0;
        this.cpu.x3 = 0;
        
        // Clear instruction and data memory
        for (let i = 0; i < 256; i++) {
            this.cpu.instructions[i] = 0;
            this.cpu.memory[i] = 0;
        }
        
        this.running = false;
        this.output = '';
        this.executionTrace = [];
        
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        
        this.cpu.requestUpdate();
    }

    // Load assembly program into instruction memory
    loadProgram(assembly) {
        const lines = assembly.split('\n').map(line => line.trim()).filter(line => line);
        let address = 0;
        let inDataSegment = false;
        
        for (const line of lines) {
            const parts = line.split(';')[0].trim().split(/\s+/);
            const instruction = parts[0].toUpperCase();
            
            // Clean up register names by removing commas
            if (parts.length > 1) {
                parts[1] = parts[1].replace(',', '');
            }
            
            if (instruction === 'DATA') {
                // Start data segment
                inDataSegment = true;
                this.cpu.instructions[address] = 0x0F; // 00001111 - DATA marker
                address += 1;
                
                // Extract string from quotes
                const match = line.match(/DATA\s+'([^']*)'/);
                if (match) {
                    const str = match[1];
                    console.log(`Loading data string: "${str}"`);
                    
                    // Load string into data memory starting at address 0
                    for (let i = 0; i < str.length; i++) {
                        this.cpu.memory[i] = str.charCodeAt(i);
                    }
                    this.cpu.memory[str.length] = 0; // null terminator
                }
                continue;
            }
            
            if (inDataSegment) {
                // We're in data segment, skip this line
                continue;
            }
            
            if (instruction === 'SET') {
                const reg = parts[1];
                const value = parseInt(parts[2]);
                const regNum = this.parseRegister(reg);
                const opcode = 0x80 | regNum;
                console.log(`Assembling SET ${reg}: regNum=${regNum}, opcode=0x${opcode.toString(16).padStart(2, '0')} (${opcode.toString(2).padStart(8, '0')})`);
                this.cpu.instructions[address] = opcode; // SET opcode (10000rrr) - 10000 = 0x10, but we need it in bits 7-3, so 0x80
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'INC') {
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                this.cpu.instructions[address] = 0x48 | regNum; // INC opcode (01001rrr) - 01001 = 0x48
                address += 1;
            } else if (instruction === 'DEC') {
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                this.cpu.instructions[address] = 0x50 | regNum; // DEC opcode (01010rrr) - 01010 = 0x50
                address += 1;
            } else if (instruction === 'PS') {
                this.cpu.instructions[address] = 0x01; // PS opcode (00000001)
                address += 1;
            } else if (instruction === 'HALT') {
                this.cpu.instructions[address] = 0x00; // HALT opcode (00000000)
                address += 1;
            }
        }
        
        this.cpu.requestUpdate();
        console.log('Data memory:', this.cpu.memory.slice(0, 20));
    }

    // Parse register name to number
    parseRegister(reg) {
        const regMap = {
            'A0': 0, 'A1': 1, 'A2': 2, 'A3': 3,
            'X0': 4, 'X1': 5, 'X2': 6, 'X3': 7
        };
        const result = regMap[reg.toUpperCase()] || 0;
        console.log(`parseRegister('${reg}') = ${result}`);
        return result;
    }

    // Get register name from number (matches specification: 000=A0, 001=A1, 010=A2, 011=A3, 100=X0, 101=X1, 110=X2, 111=X3)
    getRegisterName(reg) {
        const names = ['a0', 'a1', 'a2', 'a3', 'x0', 'x1', 'x2', 'x3'];
        return names[reg];
    }

    // Check A register addresses for out of range errors
    checkAAddresses() {
        if (this.cpu.a0 >= 32 || this.cpu.a1 >= 32 || this.cpu.a2 >= 32 || this.cpu.a3 >= 32) {
            this.running = false;
            this.cpu.mode = 3;
            this.cpu.requestUpdate();
            return true; // Error detected
        }
        return false; // No error
    }

    // Execute a single instruction
    executeStep() {
        if (this.running === false) return null;
        
        // Read instruction from instruction memory
        const instruction = this.cpu.instructions[this.cpu.pc];
        let result = null;
        let pcIncrement = 1;
        
        console.log(`Executing at PC=${this.cpu.pc}, instruction=0x${instruction.toString(16).padStart(2, '0')}`);
        
        // Special instructions (00xxxxxx)
        if ((instruction >> 6) === 0) {
            if (instruction === 0x00) {
                this.running = false;
                result = 'HALT';
            } else if (instruction === 0x01) {
                this.printString();
                result = 'PS';
            }
            pcIncrement = 1;
        }
        // Single register instructions (01xxxxxx)
        else if ((instruction >> 6) === 1) {
            const opcode = (instruction >> 3) & 0x07;
            const register = instruction & 0x07;
            const regName = this.getRegisterName(register);
            
            if (opcode === 0x01) { // INC (01001rrr) - opcode 001 in bits 5-3
                this.cpu[regName] = (this.cpu[regName] + 1) & 0xFF;
                
                // Check A register addresses for out of range errors
                if (this.checkAAddresses()) {
                    return 'ERROR: A register address out of range';
                }
                
                // CDC 6500 load/store architecture: 
                // A0/A1: Implicit LOAD from memory into X0/X1
                // A2/A3: Implicit STORE from X2/X3 to memory
                if (regName === 'a0') {
                    this.cpu.x0 = this.cpu.memory[this.cpu.a0];
                    console.log(`Implicit load: memory[${this.cpu.a0}] (${this.cpu.x0}) -> X0`);
                } else if (regName === 'a1') {
                    this.cpu.x1 = this.cpu.memory[this.cpu.a1];
                    console.log(`Implicit load: memory[${this.cpu.a1}] (${this.cpu.x1}) -> X1`);
                } else if (regName === 'a2') {
                    this.cpu.memory[this.cpu.a2] = this.cpu.x2;
                    console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${this.cpu.a2}]`);
                } else if (regName === 'a3') {
                    this.cpu.memory[this.cpu.a3] = this.cpu.x3;
                    console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${this.cpu.a3}]`);
                }
                
                result = `INC ${regName}`;
            } else if (opcode === 0x02) { // DEC (01010rrr) - opcode 010 in bits 5-3
                this.cpu[regName] = (this.cpu[regName] - 1) & 0xFF;
                result = `DEC ${regName}`;
            } else if (opcode === 0x02) { // CMPZ
                const value = this.cpu[regName];
                this.cpu.comparison = value === 0 ? '=' : value < 0 ? '<' : '>';
                result = `CMPZ ${regName}`;
            }
            pcIncrement = 1;
        }
        // Immediate instructions (10xxxxxx) - 16-bit
        else if ((instruction >> 6) === 2) {
            const opcode = (instruction >> 3) & 0x07;
            const register = instruction & 0x07;
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const regName = this.getRegisterName(register);
            
            console.log(`16-bit instruction: opcode=${opcode}, register=${register}(${regName}), immediate=${immediate}`);
            
            if (opcode === 0x00) { // SET (10000rrr)
                this.cpu[regName] = immediate;
                
                // Check A register addresses for out of range errors
                if (this.checkAAddresses()) {
                    return 'ERROR: A register address out of range';
                }
                
                // CDC 6500 load/store architecture: 
                // A0/A1: Implicit LOAD from memory into X0/X1
                // A2/A3: Implicit STORE from X2/X3 to memory
                if (regName === 'a0') {
                    this.cpu.x0 = this.cpu.memory[immediate];
                    console.log(`Implicit load: memory[${immediate}] (${this.cpu.x0}) -> X0`);
                } else if (regName === 'a1') {
                    this.cpu.x1 = this.cpu.memory[immediate];
                    console.log(`Implicit load: memory[${immediate}] (${this.cpu.x1}) -> X1`);
                } else if (regName === 'a2') {
                    this.cpu.memory[immediate] = this.cpu.x2;
                    console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${immediate}]`);
                } else if (regName === 'a3') {
                    this.cpu.memory[immediate] = this.cpu.x3;
                    console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${immediate}]`);
                }
                
                result = `SET ${regName}, ${immediate}`;
            } else if (opcode === 0x01) { // CMP
                const value = this.cpu[regName];
                this.cpu.comparison = value === immediate ? '=' : value < immediate ? '<' : '>';
                result = `CMP ${regName}, ${immediate}`;
            } else if (opcode === 0x02) { // ADD
                this.cpu[regName] = (this.cpu[regName] + immediate) & 0xFF;
                result = `ADD ${regName}, ${immediate}`;
            } else if (opcode === 0x03) { // SUB
                this.cpu[regName] = (this.cpu[regName] - immediate) & 0xFF;
                result = `SUB ${regName}, ${immediate}`;
            }
            pcIncrement = 2; // 16-bit instruction
        }
        // Jump instructions (101000xx) - 16-bit
        else if ((instruction >> 6) === 2 && (instruction & 0x38) === 0x28) {
            const jumpType = instruction & 0x03;
            const jumpAddress = this.cpu.instructions[this.cpu.pc + 1];
            
            // Check if jump address is out of range
            if (jumpAddress >= 32) {
                console.log(`Jump address out of range: 0x${jumpAddress.toString(16).padStart(2, '0')}`);
                this.running = false;
                this.cpu.mode = 2;
                this.cpu.requestUpdate();
                return 'ERROR: Jump address out of range';
            }
            
            let shouldJump = false;
            if (jumpType === 0x00) { // JE
                shouldJump = this.cpu.comparison === '=';
                result = `JE ${jumpAddress}`;
            } else if (jumpType === 0x01) { // JL
                shouldJump = this.cpu.comparison === '<';
                result = `JL ${jumpAddress}`;
            } else if (jumpType === 0x02) { // JG
                shouldJump = this.cpu.comparison === '>';
                result = `JG ${jumpAddress}`;
            }
            
            if (shouldJump) {
                this.cpu.pc = jumpAddress;
                pcIncrement = 0; // PC already set
            } else {
                pcIncrement = 2; // Skip the immediate byte
            }
        }
        // Register copy instructions (11xxxxxx)
        else if ((instruction >> 6) === 3) {
            const destReg = (instruction >> 3) & 0x07;
            const srcReg = instruction & 0x07;
            const destName = this.getRegisterName(destReg);
            const srcName = this.getRegisterName(srcReg);
            this.cpu[destName] = this.cpu[srcName];
            result = `MOV ${destName}, ${srcName}`;
            pcIncrement = 1;
        }
        // Unknown instruction
        else {
            console.log(`Unknown instruction: 0x${instruction.toString(16).padStart(2, '0')}`);
            // Invalid instruction - halt CPU and set error mode
            this.running = false;
            this.cpu.mode = 1;
            result = 'ERROR: Invalid instruction';
            pcIncrement = 1;
        }
        
        // Update PC
        this.cpu.pc += pcIncrement;
        
        // Add to execution trace
        this.executionTrace.push({
            pc: this.cpu.pc - pcIncrement,
            instruction: result,
            registers: {
                pc: this.cpu.pc,
                a0: this.cpu.a0,
                a1: this.cpu.a1,
                a2: this.cpu.a2,
                a3: this.cpu.a3,
                x0: this.cpu.x0,
                x1: this.cpu.x1,
                x2: this.cpu.x2,
                x3: this.cpu.x3,
                comparison: this.cpu.comparison
            }
        });
        
        this.cpu.requestUpdate();
        return result;
    }

    // Print string from data memory
    printString() {
        let output = '';
        let addr = 0;
        while (addr < 256) {
            const char = this.cpu.memory[addr];
            if (char === 0) break;
            output += String.fromCharCode(char);
            addr++;
        }
        this.output += output + '\n';
        console.log('PS Output:', output);
    }



    // Start continuous execution
    start() {
        if (this.running) return;
        
        this.running = true;
        this.clockInterval = setInterval(() => {
            if (!this.running) {
                this.stop();
                return;
            }
            const result = this.executeStep();
            // If executeStep returns null (halted) or the program has halted, stop execution
            if (result === null || !this.running) {
                this.stop();
                return;
            }
        }, this.clockSpeed);
    }

    // Stop execution
    stop() {
        this.running = false;
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    // Execute one step
    step() {
        if (!this.running) {
            this.running = true;
        }
        return this.executeStep();
    }

    // Load the Hello program
    loadHelloProgram() {
        this.reset();
        const helloProgram = `SET X2, 72
SET A2, 0
SET X2, 101
INC A2
SET X2, 108
INC A2
INC A2
SET X2, 111
INC A2
PS
HALT`;
        this.loadProgram(helloProgram);
    }

    // Load the Hello World program using DATA instruction
    loadHelloWorldProgram() {
        this.reset();
        const helloWorldProgram = `PS
HALT
DATA 'Hello World!'`;
        this.loadProgram(helloWorldProgram);
    }

    // Get execution status
    getStatus() {
        return {
            running: this.running,
            pc: this.cpu.pc,
            halted: !this.running && this.cpu.instructions[this.cpu.pc] === 0x00,
            output: this.output,
            trace: this.executionTrace
        };
    }

    // Get current instruction info
    getCurrentInstruction() {
        const instruction = this.cpu.instructions[this.cpu.pc];
        return {
            address: this.cpu.pc,
            instruction: instruction,
            binary: instruction.toString(2).padStart(8, '0'),
            hex: instruction.toString(16).padStart(2, '0')
        };
    }
}

// Export for use with the web component
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CDC8512Emulator;
} else if (typeof window !== 'undefined') {
    window.CDC8512Emulator = CDC8512Emulator;
}
