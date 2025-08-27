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
        
        for (const line of lines) {
            const parts = line.split(';')[0].trim().split(/\s+/);
            const instruction = parts[0].toUpperCase();
            
            if (instruction === 'SET') {
                const reg = parts[1];
                const value = parseInt(parts[2]);
                const regNum = this.parseRegister(reg);
                this.cpu.instructions[address] = 0x80 | regNum; // SET opcode (10000rrr)
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
    }

    // Parse register name to number
    parseRegister(reg) {
        const regMap = {
            'A0': 0, 'A1': 1, 'A2': 2, 'A3': 3,
            'X0': 4, 'X1': 5, 'X2': 6, 'X3': 7
        };
        return regMap[reg.toUpperCase()] || 0;
    }

    // Get register name from number
    getRegisterName(reg) {
        const names = ['a0', 'a1', 'a2', 'a3', 'x0', 'x1', 'x2', 'x3'];
        return names[reg];
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
                // If setting X2, store the character in data memory at A2's address
                if (regName === 'x2') {
                    this.storeChar(this.cpu.a2, immediate);
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
            result = 'NOP';
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

    // Store character in data memory (called by SET instructions)
    storeChar(address, charCode) {
        this.cpu.memory[address] = charCode;
        console.log(`Stored char ${charCode} ('${String.fromCharCode(charCode)}') at address ${address}`);
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
            this.executeStep();
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
