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
        
        // Clear memory highlighting
        this.cpu.clearMemoryHighlighting();
        
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        
        this.cpu.requestUpdate();
    }

    // Load assembly program into instruction memory
    loadProgram(assembly) {
        console.log('Raw assembly input:', assembly);
        // Split into lines, trim whitespace, and filter out empty lines and comment-only lines
        const lines = assembly.split('\n')
            .map(line => line.trim())
            .filter(line => {
                // Skip empty lines
                if (line.length === 0) return false;
                // Skip lines that start with semicolon or hash (comment-only lines)
                if (line.startsWith(';') || line.startsWith('#')) return false;
                return true;
            });
        console.log('Parsed lines:', lines);
        
        // Error tracking
        const errors = [];
        const maxInstructions = 256;
        
        // First pass: collect labels and calculate addresses
        const labels = {};
        let address = 0;
        let inDataSegment = false;
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            // Remove comments (everything after semicolon or hash) and trim
            const codeLine = line.split(/[;#]/)[0].trim();
            if (codeLine.length === 0) continue; // Skip lines that are only comments
            
            const parts = codeLine.split(/\s+/);
            if (parts.length === 0) continue;
            
            // Check if line starts with a label (ends with ':')
            if (parts[0].endsWith(':')) {
                const label = parts[0].slice(0, -1); // Remove the ':'
                if (label.length === 0) {
                    errors.push(`Line ${lineNum + 1}: Empty label name`);
                    continue;
                }
                if (labels.hasOwnProperty(label)) {
                    errors.push(`Line ${lineNum + 1}: Duplicate label "${label}"`);
                    continue;
                }
                labels[label] = address;
                console.log(`Label "${label}" at address 0x${address.toString(16).padStart(2, '0')}`);
                // Remove label from parts and continue with instruction
                parts.shift();
                if (parts.length === 0) continue;
            }
            
            const instruction = parts[0].toUpperCase();
            
            if (instruction === 'DATA') {
                inDataSegment = true;
                // DATA directive doesn't generate instruction code, just sets data memory
                continue;
            }
            
            if (inDataSegment) {
                continue;
            }
            
            // Validate instruction
            const validInstructions = ['SET', 'CMP', 'ADD', 'SUB', 'JE', 'JL', 'JG', 'JP', 'INC', 'DEC', 'ZERO', 'HALT', 'MOV', 'CMPZ'];
            if (!validInstructions.includes(instruction)) {
                errors.push(`Line ${lineNum + 1}: Unknown instruction "${instruction}"`);
                continue;
            }
            
            // Calculate instruction size and check for overflow
            let instructionSize = 0;
            if (instruction === 'SET' || instruction === 'CMP' || instruction === 'ADD' || instruction === 'SUB' ||
                instruction === 'JE' || instruction === 'JL' || instruction === 'JG' || instruction === 'JP') {
                instructionSize = 2; // 16-bit instructions
            } else if (instruction === 'INC' || instruction === 'DEC' || instruction === 'ZERO' || instruction === 'HALT' ||
                       instruction === 'MOV' || instruction === 'CMPZ') {
                instructionSize = 1; // 8-bit instructions
            }
            
            if (address + instructionSize > maxInstructions) {
                errors.push(`Line ${lineNum + 1}: Program too large - exceeds ${maxInstructions} bytes`);
                break;
            }
            
            address += instructionSize;
        }
        
        console.log('Labels collected:', labels);
        
        // Check for errors in first pass
        if (errors.length > 0) {
            throw new Error('Assembly errors:\n' + errors.join('\n'));
        }
        
        // Second pass: assemble with resolved labels
        address = 0;
        inDataSegment = false;
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            console.log('Processing line:', line);
            
            // Remove comments (everything after semicolon or hash) and trim
            const codeLine = line.split(/[;#]/)[0].trim();
            if (codeLine.length === 0) continue; // Skip lines that are only comments
            
            const parts = codeLine.split(/\s+/);
            console.log('Line parts:', parts);
            
            if (parts.length === 0) continue;
            
            // Check if line starts with a label
            if (parts[0].endsWith(':')) {
                const label = parts[0].slice(0, -1);
                console.log(`Skipping label: ${label}`);
                parts.shift();
                if (parts.length === 0) continue;
            }
            
            const instruction = parts[0].toUpperCase();
            console.log('Instruction:', instruction);
            
            // Clean up register names by removing commas
            if (parts.length > 1) {
                parts[1] = parts[1].replace(',', '');
            }
            
            if (instruction === 'DATA') {
                // DATA directive - just sets data memory, doesn't generate instruction code
                inDataSegment = true;
                
                // Check if it's a quoted string
                const stringMatch = line.match(/DATA\s+'([^']*)'/);
                if (stringMatch) {
                    const str = stringMatch[1];
                    console.log(`Loading data string: "${str}"`);
                    
                    // Load string into data memory starting at address 0
                    for (let i = 0; i < str.length; i++) {
                        this.cpu.memory[i] = str.charCodeAt(i);
                    }
                    this.cpu.memory[str.length] = 0; // null terminator
                } else {
                    // Parse as list of hex numbers
                    // Remove "DATA" and get the rest of the line
                    const dataPart = line.replace(/^DATA\s+/i, '').trim();
                    if (dataPart) {
                        // Split by whitespace and parse hex numbers
                        const hexValues = dataPart.split(/\s+/);
                        console.log(`Loading data hex values:`, hexValues);
                        
                        let dataAddress = 0;
                        for (const hexStr of hexValues) {
                            // Parse hex value (supports 0x prefix or just hex digits)
                            let value;
                            if (hexStr.startsWith('0x') || hexStr.startsWith('0X')) {
                                value = parseInt(hexStr, 16);
                            } else if (/^[0-9A-Fa-f]+$/.test(hexStr)) {
                                value = parseInt(hexStr, 16);
                            } else {
                                throw new Error(`Line ${lineNum + 1}: Invalid hex value in DATA directive: "${hexStr}"`);
                            }
                            
                            if (isNaN(value) || value < 0 || value > 255) {
                                throw new Error(`Line ${lineNum + 1}: Hex value out of range (0-255): "${hexStr}"`);
                            }
                            
                            if (dataAddress >= 32) {
                                throw new Error(`Line ${lineNum + 1}: Data memory overflow - too many values`);
                            }
                            
                            this.cpu.memory[dataAddress] = value;
                            console.log(`  memory[${dataAddress}] = 0x${value.toString(16).toUpperCase().padStart(2, '0')} (${value})`);
                            dataAddress++;
                        }
                    }
                }
                continue;
            }
            
            if (inDataSegment) {
                // We're in data segment, skip this line
                continue;
            }
            
            if (instruction === 'SET') {
                console.log('Processing SET instruction');
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: SET instruction requires register and value (e.g., SET X0, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                const opcode = 0x80 | regNum;
                console.log(`Assembling SET ${reg}: regNum=${regNum}, opcode=0x${opcode.toString(16).padStart(2, '0')} (${opcode.toString(2).padStart(8, '0')})`);
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'ZERO') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ZERO instruction requires register (e.g., ZERO X0)`);
                }
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                this.cpu.instructions[address] = 0x40 | regNum; // ZERO opcode (01000rrr)
                address += 1;
            } else if (instruction === 'CMPZ') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: CMPZ instruction requires register (e.g., CMPZ X0)`);
                }
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                this.cpu.instructions[address] = 0x48 | regNum; // CMPZ opcode (01001rrr)
                address += 1;
            } else if (instruction === 'INC') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: INC instruction requires register (e.g., INC X0)`);
                }
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                this.cpu.instructions[address] = 0x50 | regNum; // INC opcode (01010rrr)
                address += 1;
            } else if (instruction === 'DEC') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: DEC instruction requires register (e.g., DEC X0)`);
                }
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                this.cpu.instructions[address] = 0x58 | regNum; // DEC opcode (01011rrr)
                address += 1;
            } else if (instruction === 'HALT') {
                this.cpu.instructions[address] = 0x00; // HALT opcode (00000000)
                address += 1;
            } else if (instruction === 'CMP') {
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: CMP instruction requires register and value (e.g., CMP X0, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                const opcode = 0x88 | regNum; // CMP opcode (10001rrr)
                console.log(`Assembling CMP ${reg}, ${value}: regNum=${regNum}, opcode=0x${opcode.toString(16).padStart(2, '0')} (${opcode.toString(2).padStart(8, '0')})`);
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'JE') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: JE instruction requires label or address (e.g., JE loop)`);
                }
                const labelOrValue = parts[1];
                const value = this.resolveLabelOrValue(labelOrValue, labels);
                this.cpu.instructions[address] = 0xA0; // JE opcode (10100000)
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'JL') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: JL instruction requires label or address (e.g., JL loop)`);
                }
                const labelOrValue = parts[1];
                const value = this.resolveLabelOrValue(labelOrValue, labels);
                this.cpu.instructions[address] = 0xA1; // JL opcode (10100001)
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'JG') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: JG instruction requires label or address (e.g., JG loop)`);
                }
                const labelOrValue = parts[1];
                const value = this.resolveLabelOrValue(labelOrValue, labels);
                this.cpu.instructions[address] = 0xA2; // JG opcode (10100010)
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'JP') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: JP instruction requires label or address (e.g., JP loop)`);
                }
                const labelOrValue = parts[1];
                const value = this.resolveLabelOrValue(labelOrValue, labels);
                this.cpu.instructions[address] = 0xA3; // JP opcode (10100011)
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'MOV') {
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: MOV instruction requires destination and source registers (e.g., MOV X0, X1)`);
                }
                const destReg = parts[1];
                const srcReg = parts[2];
                const destNum = this.parseRegister(destReg);
                const srcNum = this.parseRegister(srcReg);
                const opcode = 0xC0 | (destNum << 3) | srcNum; // MOV opcode (11dddsss)
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'ADD') {
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: ADD instruction requires register and value (e.g., ADD X0, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                const opcode = 0x90 | regNum; // ADD opcode (10010rrr) - base is 0x90, not 0x92
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'SUB') {
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: SUB instruction requires register and value (e.g., SUB X0, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                const opcode = 0x98 | regNum; // SUB opcode (10011rrr) - base is 0x98, not 0x83
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else {
                // This should never happen since we validated instructions in the first pass
                throw new Error(`Line ${lineNum + 1}: Unknown instruction "${instruction}"`);
            }
        }
        
        this.cpu.requestUpdate();
        console.log('Loaded program:', this.cpu.instructions.slice(0, address));
        console.log('Data memory:', this.cpu.memory.slice(0, 20));
        console.log(`Program loaded: ${address} bytes`);
    }

    // Parse register name to number
    parseRegister(reg) {
        const regMap = {
            'A0': 0, 'A1': 1, 'A2': 2, 'A3': 3,
            'X0': 4, 'X1': 5, 'X2': 6, 'X3': 7
        };
        const result = regMap[reg.toUpperCase()];
        if (result === undefined) {
            throw new Error(`Invalid register name: "${reg}". Valid registers are: A0, A1, A2, A3, X0, X1, X2, X3`);
        }
        console.log(`parseRegister('${reg}') = ${result}`);
        return result;
    }

    // Parse value (supports decimal, hex, and single ASCII characters)
    parseValue(value) {
        let result;
        
        // Check for single quoted ASCII character
        if (value.startsWith("'") && value.endsWith("'")) {
            if (value.length !== 3) {
                throw new Error(`Invalid character literal: "${value}". Must be a single character (e.g., 'A')`);
            }
            const char = value.charAt(1);
            result = char.charCodeAt(0);
            
            // Validate that it's a standard ASCII character (0-127)
            if (result < 0 || result > 127) {
                throw new Error(`Invalid ASCII character: "${value}". Must be a standard ASCII character (0-127, e.g., 'A', '!', ' ')`);
            }
        } else if (value.startsWith('0x')) {
            result = parseInt(value, 16);
        } else {
            result = parseInt(value, 10);
        }
        
        if (isNaN(result)) {
            throw new Error(`Invalid value: "${value}". Must be a decimal number, hex value (0x...), or single ASCII character ('A')`);
        }
        
        if (result < 0 || result > 255) {
            throw new Error(`Value out of range: "${value}". Must be between 0 and 255 (0x00 to 0xFF)`);
        }
        
        return result;
    }

    // Resolve label or value (for jump instructions)
    resolveLabelOrValue(labelOrValue, labels) {
        // Check if it's a label
        if (labels.hasOwnProperty(labelOrValue)) {
            console.log(`Resolved label "${labelOrValue}" to address 0x${labels[labelOrValue].toString(16).padStart(2, '0')}`);
            return labels[labelOrValue];
        }
        
        // Check if it looks like a label but isn't defined
        if (isNaN(labelOrValue) && !labelOrValue.startsWith('0x')) {
            throw new Error(`Undefined label: "${labelOrValue}". Available labels: ${Object.keys(labels).join(', ')}`);
        }
        
        // Otherwise parse as value
        const value = this.parseValue(labelOrValue);
        if (value >= 32) {
            throw new Error(`Jump address out of range: ${labelOrValue}. Must be between 0 and 31 (0x00 to 0x1F)`);
        }
        return value;
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
        
        // 8-bit patterns (most specific) - check first
        if (instruction === 0x00) { // 00000000 - HALT
            console.log(`  Executing: HALT`);
            this.printString(); // Print automatically on HALT
            this.running = false;
            result = 'HALT';
            pcIncrement = 1;
        }
        else if (instruction === 0x0F) { // 00001111 - DATA
            console.log(`  Executing: DATA`);
            result = 'DATA';
            pcIncrement = 1;
        }
        // 5-bit patterns (bits 7-3)
        else if ((instruction >> 3) === 0x08) { // 01000xxx - ZERO
            const register = instruction & 0x07;
            const regName = this.getRegisterName(register);
            console.log(`  Executing: ZERO ${regName}`);
            this.cpu[regName] = 0;
            
            // Check A register addresses for out of range errors
            if (this.checkAAddresses()) {
                return 'ERROR: A register address out of range';
            }
            
            // CDC 6500 load/store architecture: 
            // A0/A1: Implicit LOAD from memory into X0/X1
            // A2/A3: Implicit STORE from X2/X3 to memory
            if (regName === 'a0') {
                this.cpu.x0 = this.cpu.memory[this.cpu.a0];
                this.cpu.highlightMemory(this.cpu.a0);
                console.log(`Implicit load: memory[${this.cpu.a0}] (${this.cpu.x0}) -> X0`);
            } else if (regName === 'a1') {
                this.cpu.x1 = this.cpu.memory[this.cpu.a1];
                this.cpu.highlightMemory(this.cpu.a1);
                console.log(`Implicit load: memory[${this.cpu.a1}] (${this.cpu.x1}) -> X1`);
            } else if (regName === 'a2') {
                this.cpu.memory[this.cpu.a2] = this.cpu.x2;
                this.cpu.highlightMemory(this.cpu.a2);
                console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${this.cpu.a2}]`);
            } else if (regName === 'a3') {
                this.cpu.memory[this.cpu.a3] = this.cpu.x3;
                this.cpu.highlightMemory(this.cpu.a3);
                console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${this.cpu.a3}]`);
            }
            
            result = `ZERO ${regName}`;
            pcIncrement = 1;
        }
        else if ((instruction >> 3) === 0x09) { // 01001xxx - CMPZ
            const register = instruction & 0x07;
            const regName = this.getRegisterName(register);
            console.log(`  Executing: CMPZ ${regName}`);
            const value = this.cpu[regName];
            const newComparison = value === 0 ? '=' : value < 0 ? '<' : '>';
            this.cpu.comparison = newComparison;
            console.log(`CMPZ ${regName}: ${value} vs 0 = ${this.cpu.comparison}`);
            // Force a complete re-render to ensure comparison register updates
            this.cpu.requestUpdate();
            // Also try to directly update the dropdown element
            const cmpSelect = this.cpu.shadowRoot?.querySelector('select[class*="form-control"]');
            if (cmpSelect) {
                cmpSelect.value = newComparison;
            }
            result = `CMPZ ${regName}`;
            pcIncrement = 1;
        }
        else if ((instruction >> 3) === 0x0A) { // 01010xxx - INC
            const register = instruction & 0x07;
            const regName = this.getRegisterName(register);
            console.log(`  Executing: INC ${regName}`);
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
                this.cpu.highlightMemory(this.cpu.a0);
                console.log(`Implicit load: memory[${this.cpu.a0}] (${this.cpu.x0}) -> X0`);
            } else if (regName === 'a1') {
                this.cpu.x1 = this.cpu.memory[this.cpu.a1];
                this.cpu.highlightMemory(this.cpu.a1);
                console.log(`Implicit load: memory[${this.cpu.a1}] (${this.cpu.x1}) -> X1`);
            } else if (regName === 'a2') {
                this.cpu.memory[this.cpu.a2] = this.cpu.x2;
                this.cpu.highlightMemory(this.cpu.a2);
                console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${this.cpu.a2}]`);
            } else if (regName === 'a3') {
                this.cpu.memory[this.cpu.a3] = this.cpu.x3;
                this.cpu.highlightMemory(this.cpu.a3);
                console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${this.cpu.a3}]`);
            }
            
            result = `INC ${regName}`;
            pcIncrement = 1;
        }
        else if ((instruction >> 3) === 0x0B) { // 01011xxx - DEC
            const register = instruction & 0x07;
            const regName = this.getRegisterName(register);
            console.log(`  Executing: DEC ${regName}`);
            this.cpu[regName] = (this.cpu[regName] - 1) & 0xFF;
            
            // Check A register addresses for out of range errors
            if (this.checkAAddresses()) {
                return 'ERROR: A register address out of range';
            }
            
            // CDC 6500 load/store architecture: 
            // A0/A1: Implicit LOAD from memory into X0/X1
            // A2/A3: Implicit STORE from X2/X3 to memory
            if (regName === 'a0') {
                this.cpu.x0 = this.cpu.memory[this.cpu.a0];
                this.cpu.highlightMemory(this.cpu.a0);
                console.log(`Implicit load: memory[${this.cpu.a0}] (${this.cpu.x0}) -> X0`);
            } else if (regName === 'a1') {
                this.cpu.x1 = this.cpu.memory[this.cpu.a1];
                this.cpu.highlightMemory(this.cpu.a1);
                console.log(`Implicit load: memory[${this.cpu.a1}] (${this.cpu.x1}) -> X1`);
            } else if (regName === 'a2') {
                this.cpu.memory[this.cpu.a2] = this.cpu.x2;
                this.cpu.highlightMemory(this.cpu.a2);
                console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${this.cpu.a2}]`);
            } else if (regName === 'a3') {
                this.cpu.memory[this.cpu.a3] = this.cpu.x3;
                this.cpu.highlightMemory(this.cpu.a3);
                console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${this.cpu.a3}]`);
            }
            
            result = `DEC ${regName}`;
            pcIncrement = 1;
        }
        else if ((instruction >> 3) === 0x10) { // 10000xxx - SET (16-bit)
            const register = instruction & 0x07;
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const regName = this.getRegisterName(register);
            console.log(`  Executing: SET ${regName}, ${immediate}`);
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
                this.cpu.highlightMemory(immediate);
                console.log(`Implicit load: memory[${immediate}] (${this.cpu.x0}) -> X0`);
            } else if (regName === 'a1') {
                this.cpu.x1 = this.cpu.memory[immediate];
                this.cpu.highlightMemory(immediate);
                console.log(`Implicit load: memory[${immediate}] (${this.cpu.x1}) -> X1`);
            } else if (regName === 'a2') {
                this.cpu.memory[immediate] = this.cpu.x2;
                this.cpu.highlightMemory(immediate);
                console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${immediate}]`);
            } else if (regName === 'a3') {
                this.cpu.memory[immediate] = this.cpu.x3;
                this.cpu.highlightMemory(immediate);
                console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${immediate}]`);
            }
            
            result = `SET ${regName}, ${immediate}`;
            pcIncrement = 2;
        }
        else if ((instruction >> 3) === 0x11) { // 10001xxx - CMP (16-bit)
            const register = instruction & 0x07;
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const regName = this.getRegisterName(register);
            console.log(`  Executing: CMP ${regName}, ${immediate}`);
            const value = this.cpu[regName];
            const newComparison = value === immediate ? '=' : value < immediate ? '<' : '>';
            this.cpu.comparison = newComparison;
            console.log(`CMP ${regName}: ${value} vs ${immediate} = ${this.cpu.comparison}`);
            // Force a complete re-render to ensure comparison register updates
            this.cpu.requestUpdate();
            // Also try to directly update the dropdown element
            const cmpSelect = this.cpu.shadowRoot?.querySelector('select[class*="form-control"]');
            if (cmpSelect) {
                cmpSelect.value = newComparison;
            }
            result = `CMP ${regName}, ${immediate}`;
            pcIncrement = 2;
        }
        else if ((instruction >> 3) === 0x12) { // 10010xxx - ADD (16-bit)
            const register = instruction & 0x07;
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const regName = this.getRegisterName(register);
            console.log(`  Executing: ADD ${regName}, ${immediate}`);
            this.cpu[regName] = (this.cpu[regName] + immediate) & 0xFF;
            
            // Check A register addresses for out of range errors
            if (this.checkAAddresses()) {
                return 'ERROR: A register address out of range';
            }
            
            // CDC 6500 load/store architecture: 
            // A0/A1: Implicit LOAD from memory into X0/X1
            // A2/A3: Implicit STORE from X2/X3 to memory
            if (regName === 'a0') {
                this.cpu.x0 = this.cpu.memory[this.cpu.a0];
                this.cpu.highlightMemory(this.cpu.a0);
                console.log(`Implicit load: memory[${this.cpu.a0}] (${this.cpu.x0}) -> X0`);
            } else if (regName === 'a1') {
                this.cpu.x1 = this.cpu.memory[this.cpu.a1];
                this.cpu.highlightMemory(this.cpu.a1);
                console.log(`Implicit load: memory[${this.cpu.a1}] (${this.cpu.x1}) -> X1`);
            } else if (regName === 'a2') {
                this.cpu.memory[this.cpu.a2] = this.cpu.x2;
                this.cpu.highlightMemory(this.cpu.a2);
                console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${this.cpu.a2}]`);
            } else if (regName === 'a3') {
                this.cpu.memory[this.cpu.a3] = this.cpu.x3;
                this.cpu.highlightMemory(this.cpu.a3);
                console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${this.cpu.a3}]`);
            }
            
            result = `ADD ${regName}, ${immediate}`;
            pcIncrement = 2;
        }
        else if ((instruction >> 3) === 0x13) { // 10011xxx - SUB (16-bit)
            const register = instruction & 0x07;
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const regName = this.getRegisterName(register);
            console.log(`  Executing: SUB ${regName}, ${immediate}`);
            this.cpu[regName] = (this.cpu[regName] - immediate) & 0xFF;
            
            // Check A register addresses for out of range errors
            if (this.checkAAddresses()) {
                return 'ERROR: A register address out of range';
            }
            
            // CDC 6500 load/store architecture: 
            // A0/A1: Implicit LOAD from memory into X0/X1
            // A2/A3: Implicit STORE from X2/X3 to memory
            if (regName === 'a0') {
                this.cpu.x0 = this.cpu.memory[this.cpu.a0];
                this.cpu.highlightMemory(this.cpu.a0);
                console.log(`Implicit load: memory[${this.cpu.a0}] (${this.cpu.x0}) -> X0`);
            } else if (regName === 'a1') {
                this.cpu.x1 = this.cpu.memory[this.cpu.a1];
                this.cpu.highlightMemory(this.cpu.a1);
                console.log(`Implicit load: memory[${this.cpu.a1}] (${this.cpu.x1}) -> X1`);
            } else if (regName === 'a2') {
                this.cpu.memory[this.cpu.a2] = this.cpu.x2;
                this.cpu.highlightMemory(this.cpu.a2);
                console.log(`Implicit store: X2 (${this.cpu.x2}) -> memory[${this.cpu.a2}]`);
            } else if (regName === 'a3') {
                this.cpu.memory[this.cpu.a3] = this.cpu.x3;
                this.cpu.highlightMemory(this.cpu.a3);
                console.log(`Implicit store: X3 (${this.cpu.x3}) -> memory[${this.cpu.a3}]`);
            }
            
            result = `SUB ${regName}, ${immediate}`;
            pcIncrement = 2;
        }
        else if ((instruction >> 3) === 0x14) { // 10100xxx - Jump instructions (16-bit)
            const jumpType = instruction & 0x03; // Get jump type from bits 1-0
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`Jump instruction decode: instruction=0x${instruction.toString(16).padStart(2, '0')}, jumpType=${jumpType}, immediate=${immediate}`);
            
            let shouldJump = false;
            if (jumpType === 0x00) { // 10100000 - JE
                shouldJump = this.cpu.comparison === '=';
                console.log(`JE ${immediate}: comparison=${this.cpu.comparison}, shouldJump=${shouldJump}`);
                result = `JE ${immediate}`;
            } else if (jumpType === 0x01) { // 10100001 - JL
                shouldJump = this.cpu.comparison === '<';
                console.log(`JL ${immediate}: comparison=${this.cpu.comparison}, shouldJump=${shouldJump}`);
                result = `JL ${immediate}`;
            } else if (jumpType === 0x02) { // 10100010 - JG
                shouldJump = this.cpu.comparison === '>';
                console.log(`JG ${immediate}: comparison=${this.cpu.comparison}, shouldJump=${shouldJump}`);
                result = `JG ${immediate}`;
            } else if (jumpType === 0x03) { // 10100011 - JP
                shouldJump = true; // Always jump
                console.log(`JP ${immediate}: unconditional jump`);
                result = `JP ${immediate}`;
            }
            
            if (shouldJump) {
                console.log(`JUMP: JUMPING to address ${immediate} (PC was ${this.cpu.pc})`);
                this.cpu.pc = immediate;
                pcIncrement = 0; // PC already set
            } else {
                console.log(`JUMP: NOT jumping, continuing to next instruction (PC += 2)`);
                pcIncrement = 2; // Skip the immediate byte
            }
        }
        else if ((instruction >> 4) === 0x06) { // 0110ddss - ADD X[dd], X[ss]
            const destReg = (instruction >> 2) & 0x03;
            const srcReg = instruction & 0x03;
            const destName = this.getRegisterName(destReg + 4); // X registers start at index 4
            const srcName = this.getRegisterName(srcReg + 4);
            console.log(`  Executing: ADD ${destName}, ${srcName}`);
            this.cpu[destName] = (this.cpu[destName] + this.cpu[srcName]) & 0xFF;
            result = `ADD ${destName}, ${srcName}`;
            pcIncrement = 1;
        }
        else if ((instruction >> 4) === 0x07) { // 0111ddss - SUB X[dd], X[ss]
            const destReg = (instruction >> 2) & 0x03;
            const srcReg = instruction & 0x03;
            const destName = this.getRegisterName(destReg + 4); // X registers start at index 4
            const srcName = this.getRegisterName(srcReg + 4);
            console.log(`  Executing: SUB ${destName}, ${srcName}`);
            this.cpu[destName] = (this.cpu[destName] - this.cpu[srcName]) & 0xFF;
            result = `SUB ${destName}, ${srcName}`;
            pcIncrement = 1;
        }
        // 2-bit patterns (least specific) - check last
        else if ((instruction >> 6) === 0x00) { // 00xxxxxx - Special instructions (already handled above)
            console.log(`  ERROR: Invalid special instruction - halting CPU`);
            this.running = false;
            this.cpu.mode = 1;
            result = 'ERROR: Invalid instruction';
            pcIncrement = 1;
        }
        else if ((instruction >> 6) === 0x01) { // 01xxxxxx - Single register instructions (already handled above)
            console.log(`  ERROR: Invalid single register instruction - halting CPU`);
            this.running = false;
            this.cpu.mode = 1;
            result = 'ERROR: Invalid instruction';
            pcIncrement = 1;
        }
        else if ((instruction >> 6) === 0x02) { // 10xxxxxx - Immediate instructions (already handled above)
            console.log(`  ERROR: Invalid immediate instruction - halting CPU`);
            this.running = false;
            this.cpu.mode = 1;
            result = 'ERROR: Invalid instruction';
            pcIncrement = 1;
        }
        else if ((instruction >> 6) === 0x03) { // 11xxxxxx - Register copy instructions
            const destReg = (instruction >> 3) & 0x07;
            const srcReg = instruction & 0x07;
            const destName = this.getRegisterName(destReg);
            const srcName = this.getRegisterName(srcReg);
            console.log(`  Executing: MOV ${destName}, ${srcName}`);
            this.cpu[destName] = this.cpu[srcName];
            result = `MOV ${destName}, ${srcName}`;
            pcIncrement = 1;
        }
        // Unknown instruction
        else {
            console.log(`  ERROR: Invalid instruction - halting CPU`);
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
HALT`;
        this.loadProgram(helloProgram);
    }

    // Load the Hello World program using DATA instruction
    loadHelloWorldProgram() {
        this.reset();
        const helloWorldProgram = `HALT
DATA 'Hello World!'`;
        this.loadProgram(helloWorldProgram);
    }

    // Load the Hi program - simple program to print "Hi"
    loadHiProgram() {
        this.reset();
        const hiProgram = `SET X2, 'H'
ZERO A2
SET X2, 'i'
INC A2
HALT`;
        this.loadProgram(hiProgram);
    }

    // Load the Add Sample program - demonstrates loading from memory, adding, and storing
    loadAddSample() {
        this.reset();
        // Put 10 (0x0A) in memory location 0x01 using DATA directive
        // Load 0x01 into A0 (which loads memory[1] = 10 into X0)
        // Add 5 to X0 (X0 becomes 15)
        // Copy X0 to X2
        // Store X2 into memory location 0x03
        const addSampleProgram = `SET A0, 1
ADD X0, 5
MOV X2, X0
SET A2, 3
HALT
DATA 0x00 0x0A`;
        this.loadProgram(addSampleProgram);
    }

    // Load the Uppercase Sample program - converts lowercase letter to uppercase
    loadUppercaseSample() {
        this.reset();
        // Load 0x70 (lowercase 'p') directly into X2 using immediate instruction
        // Compare X2 to 'a' (0x61) - if less than, it's already uppercase or not a letter
        // If >= 'a', subtract 0x20 to convert to uppercase
        const uppercaseProgram = `SET X2, 0x70
CMP X2, 0x61
JL skip
SUB X2, 0x20
skip:
HALT`;
        this.loadProgram(uppercaseProgram);
    }

    // Load the Simple Sample program - demonstrates basic register operations with no immediates
    loadSimpleSample() {
        this.reset();
        // Simple program using only register operations: ZERO, INC
        const simpleProgram = `ZERO X2
INC X2
INC X2
ZERO A2
HALT`;
        this.loadProgram(simpleProgram);
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
