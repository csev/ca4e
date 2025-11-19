/**
 * CDC6504 CPU Emulator Module
 * Works with the existing CDC6504 web component
 */

class CDC6504Emulator {
    constructor(cpuComponent) {
        this.cpu = cpuComponent;
        this.running = false;
        this.clockInterval = null;
        this.clockSpeed = 500; // 0.5 Hz = 500ms
        this.output = '';
        this.executionTrace = [];
    }

    // Reset the CPU to initial state (6502)
    reset() {
        this.cpu.pc = 0;
        this.cpu.acc = 0;  // Accumulator
        this.cpu.x = 0;    // X register
        this.cpu.y = 0;    // Y register
        this.cpu.z = false; // Zero flag
        this.cpu.n = false; // Negative flag
        this.cpu.c = false; // Carry flag
        this.cpu.mode = 0;  // Error mode
        
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
            
            // Validate instruction (6502 instruction set)
            const validInstructions = ['SET', 'CMP', 'ADD', 'SUB', 'JE', 'JL', 'JG', 'JP', 'INC', 'DEC', 'ZERO', 'HALT', 'MOV', 'CMPZ',
                                      'LDA', 'LDX', 'LDY', 'STA', 'STX', 'STY', 'TAX', 'TAY', 'TXA', 'TYA', 'INX', 'INY', 'DEX', 'DEY',
                                      'ADC', 'SBC', 'BEQ', 'BNE', 'BMI', 'BPL', 'BCS', 'BCC', 'JMP', 'BRK'];
            if (!validInstructions.includes(instruction)) {
                errors.push(`Line ${lineNum + 1}: Unknown instruction "${instruction}"`);
                continue;
            }
            
            // Calculate instruction size and check for overflow (6502 instruction sizes)
            let instructionSize = 0;
            // 2-byte instructions (immediate or zero-page): LDA #, LDX #, LDY #, CMP #, ADC #, SBC #, STA $, STX $, STY $, INC $, DEC $
            // Branch instructions: BEQ, BNE, BMI, BPL, BCS, BCC (relative branches)
            if (instruction === 'SET' || instruction === 'CMP' || instruction === 'ADD' || instruction === 'SUB' ||
                instruction === 'JE' || instruction === 'JL' || instruction === 'JG' || instruction === 'JP' ||
                instruction === 'LDA' || instruction === 'LDX' || instruction === 'LDY' || instruction === 'STA' ||
                instruction === 'STX' || instruction === 'STY' || instruction === 'ADC' || instruction === 'SBC' ||
                instruction === 'BEQ' || instruction === 'BNE' || instruction === 'BMI' || instruction === 'BPL' ||
                instruction === 'BCS' || instruction === 'BCC' || instruction === 'INC' || instruction === 'DEC') {
                instructionSize = 2; // 2-byte instructions
            } else if (instruction === 'ZERO' || instruction === 'HALT' || instruction === 'MOV' || instruction === 'CMPZ' ||
                       instruction === 'TAX' || instruction === 'TAY' || instruction === 'TXA' || instruction === 'TYA' ||
                       instruction === 'INX' || instruction === 'INY' || instruction === 'DEX' || instruction === 'DEY' ||
                       instruction === 'JMP' || instruction === 'BRK') {
                instructionSize = 1; // 1-byte instructions (or 3-byte for JMP absolute, but we'll use zero-page)
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
            
            if (instruction === 'SET' || instruction === 'LDA' || instruction === 'LDX' || instruction === 'LDY') {
                console.log(`Processing ${instruction} instruction`);
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires register and value (e.g., ${instruction} ACC, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                // Map to 6502 opcodes: LDA # (A9), LDX # (A2), LDY # (A0)
                let opcode;
                if (instruction === 'SET' || instruction === 'LDA') {
                    // SET/LDA: Load accumulator immediate
                    if (regNum !== 0) {
                        throw new Error(`Line ${lineNum + 1}: LDA/SET can only be used with ACC register`);
                    }
                    opcode = 0xA9; // LDA # (6502 immediate)
                } else if (instruction === 'LDX') {
                    if (regNum !== 1) {
                        throw new Error(`Line ${lineNum + 1}: LDX can only be used with X register`);
                    }
                    opcode = 0xA2; // LDX # (6502 immediate)
                } else if (instruction === 'LDY') {
                    if (regNum !== 2) {
                        throw new Error(`Line ${lineNum + 1}: LDY can only be used with Y register`);
                    }
                    opcode = 0xA0; // LDY # (6502 immediate)
                }
                console.log(`Assembling ${instruction} ${reg}, ${value}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'ZERO') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ZERO instruction requires register (e.g., ZERO ACC)`);
                }
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                // Map to 6502: LDA #0 (A9 00), LDX #0 (A2 00), LDY #0 (A0 00)
                let opcode;
                if (regNum === 0) {
                    opcode = 0xA9; // LDA #0
                } else if (regNum === 1) {
                    opcode = 0xA2; // LDX #0
                } else if (regNum === 2) {
                    opcode = 0xA0; // LDY #0
                }
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = 0; // Zero value
                address += 2;
            } else if (instruction === 'CMPZ') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: CMPZ instruction requires register (e.g., CMPZ ACC)`);
                }
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                // 6502 CMP #0 compares accumulator with zero
                if (regNum !== 0) {
                    throw new Error(`Line ${lineNum + 1}: CMPZ can only be used with ACC register (6502 CMP compares with accumulator)`);
                }
                const opcode = 0xC9; // CMP # (6502 immediate)
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = 0; // Compare with zero
                address += 2;
            } else if (instruction === 'INC' || instruction === 'INX' || instruction === 'INY') {
                if (parts.length < 2 && instruction === 'INC') {
                    throw new Error(`Line ${lineNum + 1}: INC instruction requires register (e.g., INC X)`);
                }
                let opcode;
                if (instruction === 'INX') {
                    opcode = 0xE8; // INX (6502)
                } else if (instruction === 'INY') {
                    opcode = 0xC8; // INY (6502)
                } else {
                    // INC with register
                    const reg = parts[1];
                    const regNum = this.parseRegister(reg);
                    if (regNum === 1) {
                        opcode = 0xE8; // INX
                    } else if (regNum === 2) {
                        opcode = 0xC8; // INY
                    } else {
                        throw new Error(`Line ${lineNum + 1}: INC can only be used with X or Y register (use ADD for accumulator)`);
                    }
                }
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'DEC' || instruction === 'DEX' || instruction === 'DEY') {
                if (parts.length < 2 && instruction === 'DEC') {
                    throw new Error(`Line ${lineNum + 1}: DEC instruction requires register (e.g., DEC X)`);
                }
                let opcode;
                if (instruction === 'DEX') {
                    opcode = 0xCA; // DEX (6502)
                } else if (instruction === 'DEY') {
                    opcode = 0x88; // DEY (6502)
                } else {
                    // DEC with register
                    const reg = parts[1];
                    const regNum = this.parseRegister(reg);
                    if (regNum === 1) {
                        opcode = 0xCA; // DEX
                    } else if (regNum === 2) {
                        opcode = 0x88; // DEY
                    } else {
                        throw new Error(`Line ${lineNum + 1}: DEC can only be used with X or Y register (use SUB for accumulator)`);
                    }
                }
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'HALT' || instruction === 'BRK') {
                this.cpu.instructions[address] = 0x00; // BRK/HALT opcode (6502 BRK = 0x00)
                address += 1;
            } else if (instruction === 'CMP') {
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: CMP instruction requires register and value (e.g., CMP ACC, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                // 6502 CMP # compares with accumulator
                if (regNum !== 0) {
                    throw new Error(`Line ${lineNum + 1}: CMP can only be used with ACC register (6502 CMP compares with accumulator)`);
                }
                const opcode = 0xC9; // CMP # (6502 immediate)
                console.log(`Assembling CMP ${reg}, ${value}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'JE' || instruction === 'BEQ') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires label or address (e.g., ${instruction} loop)`);
                }
                const labelOrValue = parts[1];
                const targetAddr = this.resolveLabelOrValue(labelOrValue, labels);
                // Calculate relative branch offset (6502 BEQ is relative)
                const offset = targetAddr - (address + 2);
                if (offset < -128 || offset > 127) {
                    throw new Error(`Line ${lineNum + 1}: Branch target too far (offset ${offset}, must be -128 to 127)`);
                }
                this.cpu.instructions[address] = 0xF0; // BEQ (6502 branch if zero)
                this.cpu.instructions[address + 1] = offset & 0xFF; // Signed byte
                address += 2;
            } else if (instruction === 'JL' || instruction === 'BMI') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires label or address (e.g., ${instruction} loop)`);
                }
                const labelOrValue = parts[1];
                const targetAddr = this.resolveLabelOrValue(labelOrValue, labels);
                const offset = targetAddr - (address + 2);
                if (offset < -128 || offset > 127) {
                    throw new Error(`Line ${lineNum + 1}: Branch target too far (offset ${offset}, must be -128 to 127)`);
                }
                this.cpu.instructions[address] = 0x30; // BMI (6502 branch if minus/negative)
                this.cpu.instructions[address + 1] = offset & 0xFF;
                address += 2;
            } else if (instruction === 'JG' || instruction === 'BPL') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires label or address (e.g., ${instruction} loop)`);
                }
                const labelOrValue = parts[1];
                const targetAddr = this.resolveLabelOrValue(labelOrValue, labels);
                const offset = targetAddr - (address + 2);
                if (offset < -128 || offset > 127) {
                    throw new Error(`Line ${lineNum + 1}: Branch target too far (offset ${offset}, must be -128 to 127)`);
                }
                this.cpu.instructions[address] = 0x10; // BPL (6502 branch if plus/positive)
                this.cpu.instructions[address + 1] = offset & 0xFF;
                address += 2;
            } else if (instruction === 'JP' || instruction === 'JMP') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires label or address (e.g., ${instruction} loop)`);
                }
                const labelOrValue = parts[1];
                const value = this.resolveLabelOrValue(labelOrValue, labels);
                // For 256-byte memory, use zero-page absolute jump (4C low high, but we'll use just low byte)
                // Actually, let's use a simplified 2-byte JMP: opcode + address
                this.cpu.instructions[address] = 0x4C; // JMP absolute (6502)
                this.cpu.instructions[address + 1] = value; // Low byte (we only have 256 bytes, so this is sufficient)
                address += 2;
            } else if (instruction === 'MOV' || instruction === 'TAX' || instruction === 'TAY' || instruction === 'TXA' || instruction === 'TYA') {
                let opcode;
                if (instruction === 'TAX') {
                    opcode = 0xAA; // TAX (6502)
                } else if (instruction === 'TAY') {
                    opcode = 0xA8; // TAY (6502)
                } else if (instruction === 'TXA') {
                    opcode = 0x8A; // TXA (6502)
                } else if (instruction === 'TYA') {
                    opcode = 0x98; // TYA (6502)
                } else {
                    // MOV with two registers
                    if (parts.length < 3) {
                        throw new Error(`Line ${lineNum + 1}: MOV instruction requires destination and source registers (e.g., MOV X, ACC)`);
                    }
                    const destReg = parts[1];
                    const srcReg = parts[2];
                    const destNum = this.parseRegister(destReg);
                    const srcNum = this.parseRegister(srcReg);
                    // Map to 6502 transfer instructions
                    if (destNum === 1 && srcNum === 0) {
                        opcode = 0xAA; // TAX
                    } else if (destNum === 2 && srcNum === 0) {
                        opcode = 0xA8; // TAY
                    } else if (destNum === 0 && srcNum === 1) {
                        opcode = 0x8A; // TXA
                    } else if (destNum === 0 && srcNum === 2) {
                        opcode = 0x98; // TYA
                    } else {
                        throw new Error(`Line ${lineNum + 1}: MOV ${destReg}, ${srcReg} is not a valid 6502 transfer instruction`);
                    }
                }
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'ADD' || instruction === 'ADC') {
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires register and value (e.g., ${instruction} ACC, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                // 6502 ADC # adds to accumulator
                if (regNum !== 0) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} can only be used with ACC register (6502 ADC adds to accumulator)`);
                }
                const opcode = 0x69; // ADC # (6502 immediate)
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'SUB' || instruction === 'SBC') {
                if (parts.length < 3) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires register and value (e.g., ${instruction} ACC, 42)`);
                }
                const reg = parts[1];
                const value = this.parseValue(parts[2]);
                const regNum = this.parseRegister(reg);
                // 6502 SBC # subtracts from accumulator
                if (regNum !== 0) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} can only be used with ACC register (6502 SBC subtracts from accumulator)`);
                }
                const opcode = 0xE9; // SBC # (6502 immediate)
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = value;
                address += 2;
            } else if (instruction === 'CMPZ') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: CMPZ instruction requires register (e.g., CMPZ ACC)`);
                }
                const reg = parts[1];
                const regNum = this.parseRegister(reg);
                // 6502 CMP #0 compares accumulator with zero
                if (regNum !== 0) {
                    throw new Error(`Line ${lineNum + 1}: CMPZ can only be used with ACC register (6502 CMP compares with accumulator)`);
                }
                const opcode = 0xC9; // CMP # (6502 immediate)
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = 0; // Compare with zero
                address += 2;
            } else if (instruction === 'STA' || instruction === 'STX' || instruction === 'STY') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires address (e.g., ${instruction} $10)`);
                }
                const addrStr = parts[1];
                // Remove $ prefix if present
                const addr = addrStr.startsWith('$') ? parseInt(addrStr.substring(1), 16) : this.parseValue(addrStr);
                let opcode;
                if (instruction === 'STA') {
                    opcode = 0x85; // STA zero page (6502)
                } else if (instruction === 'STX') {
                    opcode = 0x86; // STX zero page (6502)
                } else if (instruction === 'STY') {
                    opcode = 0x84; // STY zero page (6502)
                }
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = addr;
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

    // Parse register name to number (6502 registers)
    parseRegister(reg) {
        const regMap = {
            'ACC': 0, 'A': 0,  // Accumulator
            'X': 1,            // X register
            'Y': 2             // Y register
        };
        const result = regMap[reg.toUpperCase()];
        if (result === undefined) {
            throw new Error(`Invalid register name: "${reg}". Valid registers are: ACC (or A), X, Y`);
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

    // Get register name from number (6502 registers)
    getRegisterName(reg) {
        const names = ['acc', 'x', 'y'];
        return names[reg] || '?';
    }

    // Update status flags based on value (6502 semantics)
    updateStatusFlags(value) {
        this.cpu.z = (value === 0);
        this.cpu.n = ((value & 0x80) !== 0); // Negative flag (bit 7 set)
        // Carry flag is updated separately for arithmetic operations
    }

    // Update status flags for comparison (6502 CMP semantics)
    updateCompareFlags(acc, value) {
        const result = (acc - value) & 0xFF;
        this.cpu.z = (acc === value);
        this.cpu.n = ((result & 0x80) !== 0);
        this.cpu.c = (acc >= value); // Carry set if acc >= value (no borrow)
    }

    // Execute a single instruction (6502)
    executeStep() {
        if (this.running === false) return null;
        
        // Read instruction from instruction memory
        const instruction = this.cpu.instructions[this.cpu.pc];
        let result = null;
        let pcIncrement = 1;
        
        console.log(`Executing at PC=${this.cpu.pc}, instruction=0x${instruction.toString(16).padStart(2, '0')}`);
        
        // Decode 6502 opcodes
        if (instruction === 0x00) { // BRK - Break/Halt
            console.log(`  Executing: BRK`);
            this.printString(); // Print automatically on BRK
            this.running = false;
            result = 'BRK';
            pcIncrement = 1;
        }
        // Load instructions (immediate mode)
        else if (instruction === 0xA9) { // LDA # - Load accumulator immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: LDA #${immediate}`);
            this.cpu.acc = immediate;
            this.updateStatusFlags(this.cpu.acc);
            result = `LDA #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xA2) { // LDX # - Load X immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: LDX #${immediate}`);
            this.cpu.x = immediate;
            this.updateStatusFlags(this.cpu.x);
            result = `LDX #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xA0) { // LDY # - Load Y immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: LDY #${immediate}`);
            this.cpu.y = immediate;
            this.updateStatusFlags(this.cpu.y);
            result = `LDY #${immediate}`;
            pcIncrement = 2;
        }
        // Store instructions (zero page)
        else if (instruction === 0x85) { // STA $ - Store accumulator zero page
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: STA $${addr.toString(16).padStart(2, '0')}`);
            this.cpu.memory[addr] = this.cpu.acc;
            this.cpu.highlightMemory(addr);
            result = `STA $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0x86) { // STX $ - Store X zero page
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: STX $${addr.toString(16).padStart(2, '0')}`);
            this.cpu.memory[addr] = this.cpu.x;
            this.cpu.highlightMemory(addr);
            result = `STX $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0x84) { // STY $ - Store Y zero page
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: STY $${addr.toString(16).padStart(2, '0')}`);
            this.cpu.memory[addr] = this.cpu.y;
            this.cpu.highlightMemory(addr);
            result = `STY $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        // Compare instruction
        else if (instruction === 0xC9) { // CMP # - Compare accumulator immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: CMP #${immediate}`);
            this.updateCompareFlags(this.cpu.acc, immediate);
            result = `CMP #${immediate}`;
            pcIncrement = 2;
        }
        // Arithmetic instructions
        else if (instruction === 0x69) { // ADC # - Add with carry immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: ADC #${immediate}`);
            const sum = this.cpu.acc + immediate + (this.cpu.c ? 1 : 0);
            this.cpu.c = (sum > 0xFF); // Carry set if overflow
            this.cpu.acc = sum & 0xFF;
            this.updateStatusFlags(this.cpu.acc);
            result = `ADC #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xE9) { // SBC # - Subtract with carry immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: SBC #${immediate}`);
            // 6502 SBC: A = A - M - (1 - C)
            // Use old carry value for calculation, then set new carry
            const oldC = this.cpu.c;
            const diff = this.cpu.acc - immediate - (oldC ? 0 : 1);
            this.cpu.c = (this.cpu.acc >= immediate); // Carry set if no borrow (A >= M)
            this.cpu.acc = diff & 0xFF;
            this.updateStatusFlags(this.cpu.acc);
            result = `SBC #${immediate}`;
            pcIncrement = 2;
        }
        // Increment/Decrement instructions
        else if (instruction === 0xE8) { // INX - Increment X
            console.log(`  Executing: INX`);
            this.cpu.x = (this.cpu.x + 1) & 0xFF;
            this.updateStatusFlags(this.cpu.x);
            result = 'INX';
            pcIncrement = 1;
        }
        else if (instruction === 0xC8) { // INY - Increment Y
            console.log(`  Executing: INY`);
            this.cpu.y = (this.cpu.y + 1) & 0xFF;
            this.updateStatusFlags(this.cpu.y);
            result = 'INY';
            pcIncrement = 1;
        }
        else if (instruction === 0xCA) { // DEX - Decrement X
            console.log(`  Executing: DEX`);
            this.cpu.x = (this.cpu.x - 1) & 0xFF;
            this.updateStatusFlags(this.cpu.x);
            result = 'DEX';
            pcIncrement = 1;
        }
        else if (instruction === 0x88) { // DEY - Decrement Y
            console.log(`  Executing: DEY`);
            this.cpu.y = (this.cpu.y - 1) & 0xFF;
            this.updateStatusFlags(this.cpu.y);
            result = 'DEY';
            pcIncrement = 1;
        }
        // Transfer instructions
        else if (instruction === 0xAA) { // TAX - Transfer accumulator to X
            console.log(`  Executing: TAX`);
            this.cpu.x = this.cpu.acc;
            this.updateStatusFlags(this.cpu.x);
            result = 'TAX';
            pcIncrement = 1;
        }
        else if (instruction === 0xA8) { // TAY - Transfer accumulator to Y
            console.log(`  Executing: TAY`);
            this.cpu.y = this.cpu.acc;
            this.updateStatusFlags(this.cpu.y);
            result = 'TAY';
            pcIncrement = 1;
        }
        else if (instruction === 0x8A) { // TXA - Transfer X to accumulator
            console.log(`  Executing: TXA`);
            this.cpu.acc = this.cpu.x;
            this.updateStatusFlags(this.cpu.acc);
            result = 'TXA';
            pcIncrement = 1;
        }
        else if (instruction === 0x98) { // TYA - Transfer Y to accumulator
            console.log(`  Executing: TYA`);
            this.cpu.acc = this.cpu.y;
            this.updateStatusFlags(this.cpu.acc);
            result = 'TYA';
            pcIncrement = 1;
        }
        // Branch instructions (relative) - 6502 branches are relative to the instruction after the branch
        else if (instruction === 0xF0) { // BEQ - Branch if equal (zero flag set)
            const offset = this.cpu.instructions[this.cpu.pc + 1];
            const signedOffset = (offset & 0x80) ? (offset - 256) : offset; // Sign extend
            console.log(`  Executing: BEQ ${signedOffset > 0 ? '+' : ''}${signedOffset}`);
            if (this.cpu.z) {
                const newPC = (this.cpu.pc + 2 + signedOffset) & 0xFF;
                this.cpu.pc = newPC;
                pcIncrement = 0; // PC already updated
                result = `BEQ +${signedOffset} (taken -> PC=${newPC})`;
            } else {
                result = `BEQ +${signedOffset} (not taken)`;
                pcIncrement = 2;
            }
        }
        else if (instruction === 0x30) { // BMI - Branch if minus (negative flag set)
            const offset = this.cpu.instructions[this.cpu.pc + 1];
            const signedOffset = (offset & 0x80) ? (offset - 256) : offset;
            console.log(`  Executing: BMI ${signedOffset > 0 ? '+' : ''}${signedOffset}`);
            if (this.cpu.n) {
                const newPC = (this.cpu.pc + 2 + signedOffset) & 0xFF;
                this.cpu.pc = newPC;
                pcIncrement = 0;
                result = `BMI +${signedOffset} (taken -> PC=${newPC})`;
            } else {
                result = `BMI +${signedOffset} (not taken)`;
                pcIncrement = 2;
            }
        }
        else if (instruction === 0x10) { // BPL - Branch if plus (negative flag clear)
            const offset = this.cpu.instructions[this.cpu.pc + 1];
            const signedOffset = (offset & 0x80) ? (offset - 256) : offset;
            console.log(`  Executing: BPL ${signedOffset > 0 ? '+' : ''}${signedOffset}`);
            if (!this.cpu.n) {
                const newPC = (this.cpu.pc + 2 + signedOffset) & 0xFF;
                this.cpu.pc = newPC;
                pcIncrement = 0;
                result = `BPL +${signedOffset} (taken -> PC=${newPC})`;
            } else {
                result = `BPL +${signedOffset} (not taken)`;
                pcIncrement = 2;
            }
        }
        // Jump instruction
        else if (instruction === 0x4C) { // JMP - Jump absolute (zero-page for our 256-byte memory)
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            console.log(`  Executing: JMP $${addr.toString(16).padStart(2, '0')}`);
            this.cpu.pc = addr;
            pcIncrement = 0; // PC already updated
            result = `JMP $${addr.toString(16).padStart(2, '0')}`;
        }
        // Unknown instruction
        else {
            console.log(`  ERROR: Invalid instruction 0x${instruction.toString(16).padStart(2, '0')} - halting CPU`);
            this.running = false;
            this.cpu.mode = 1;
            result = `ERROR: Invalid instruction 0x${instruction.toString(16).padStart(2, '0')}`;
            pcIncrement = 1;
        }
        
        // Save PC before updating for trace
        const oldPC = this.cpu.pc;
        
        // Update PC (if not already updated by branch/jump)
        if (pcIncrement > 0) {
            this.cpu.pc = (this.cpu.pc + pcIncrement) & 0xFF;
        }
        
        // Add to execution trace
        this.executionTrace.push({
            pc: oldPC,
            instruction: result,
            registers: {
                pc: this.cpu.pc,
                acc: this.cpu.acc,
                x: this.cpu.x,
                y: this.cpu.y,
                z: this.cpu.z,
                n: this.cpu.n,
                c: this.cpu.c
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

    // Load the Hello program (6502)
    loadHelloProgram() {
        this.reset();
        // Store characters to memory using STA
        const helloProgram = `LDA ACC, 72    ; 'H'
STA $00
LDA ACC, 101   ; 'e'
STA $01
LDA ACC, 108   ; 'l'
STA $02
STA $03        ; 'l' again
LDA ACC, 111   ; 'o'
STA $04
BRK`;
        this.loadProgram(helloProgram);
    }

    // Load the Hello World program using DATA instruction
    loadHelloWorldProgram() {
        this.reset();
        const helloWorldProgram = `HALT
DATA 'Hello World!'`;
        this.loadProgram(helloWorldProgram);
    }

    // Load the Hi program - simple program to print "Hi" (6502)
    loadHiProgram() {
        this.reset();
        const hiProgram = `LDA ACC, 'H'
STA $00
LDA ACC, 'i'
STA $01
BRK`;
        this.loadProgram(hiProgram);
    }

    // Load the Add Sample program - demonstrates loading, adding, and storing (6502)
    loadAddSample() {
        this.reset();
        // Put 10 (0x0A) in memory location 0x01 using DATA directive
        // Load from memory[1] into accumulator (would need LDA $01, but we only have immediate)
        // For now, just demonstrate: load 10, add 5, store result
        const addSampleProgram = `LDA ACC, 10    ; Load 10 into accumulator
ADC ACC, 5      ; Add 5 (result = 15)
STA $03         ; Store result to memory[3]
BRK
DATA 0x00 0x0A`;
        this.loadProgram(addSampleProgram);
    }

    // Load the Uppercase Sample program - converts lowercase letter to uppercase (6502)
    loadUppercaseSample() {
        this.reset();
        // Load 0x70 (lowercase 'p') into accumulator
        // Compare to 'a' (0x61) - if less than, it's already uppercase or not a letter
        // If >= 'a', subtract 0x20 to convert to uppercase
        const uppercaseProgram = `LDA ACC, 0x70
CMP ACC, 0x61
BMI skip        ; Branch if minus (less than)
SBC ACC, 0x20   ; Subtract 0x20 to convert to uppercase
skip:
BRK`;
        this.loadProgram(uppercaseProgram);
    }

    // Load the Simple Sample program - demonstrates basic register operations (6502)
    loadSimpleSample() {
        this.reset();
        // Simple program: zero X, increment X twice
        const simpleProgram = `LDX X, 0       ; Zero X register
INX             ; Increment X
INX             ; Increment X again
BRK`;
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
    module.exports = CDC6504Emulator;
} else if (typeof window !== 'undefined') {
    window.CDC6504Emulator = CDC6504Emulator;
}
