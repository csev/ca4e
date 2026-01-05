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
        this.errorMessage = null; // Error message if CPU stopped due to error
        this.narrateEnabled = false; // Enable/disable narration
        this.executionPromise = null; // Promise for async execution loop
    }

    // Convert a hex number to speech-friendly format (e.g., 0x03 -> "zero-x-zero-three")
    hexToSpeech(hexValue) {
        const hexStr = hexValue.toString(16).padStart(2, '0');
        const digits = hexStr.split('').map(digit => {
            const digitMap = {
                '0': 'zero',
                '1': 'one',
                '2': 'two',
                '3': 'three',
                '4': 'four',
                '5': 'five',
                '6': 'six',
                '7': 'seven',
                '8': 'eight',
                '9': 'nine',
                'a': 'A',
                'b': 'B',
                'c': 'C',
                'd': 'D',
                'e': 'E',
                'f': 'F'
            };
            return digitMap[digit.toLowerCase()] || digit;
        });
        return `zero-x-${digits.join('-')}`;
    }

    // Narrate an instruction execution (returns Promise that resolves when speech completes)
    narrateInstruction(pc, instructionText) {
        if (!this.narrateEnabled) {
            return Promise.resolve();
        }

        // Check if speech synthesis is available
        if (!('speechSynthesis' in window)) {
            return Promise.resolve();
        }

        // Create speech text with clearer pronunciation
        // Format: "P C [hex], [instruction]"
        const pcHex = this.hexToSpeech(pc);
        const speechText = `P C ${pcHex}. ${instructionText}`;
        
        // Log what we're about to speak for debugging
        console.log(`[NARRATION] Speaking: "${speechText}"`);
        
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.rate = 0.8; // Slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Add event listeners to track speech events
            utterance.onstart = () => {
                // Speech started
            };
            utterance.onend = () => {
                resolve();
            };
            utterance.onerror = (event) => {
                console.error(`[NARRATION] Error speaking: "${speechText}"`, event);
                resolve(); // Resolve even on error to continue execution
            };
            
            window.speechSynthesis.speak(utterance);
        });
    }

    // Stop any ongoing narration
    stopNarration() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    // Reset the CPU to initial state (6502)
    reset() {
        this.cpu.pc = 0;
        this.cpu.acc = 0;  // Accumulator
        this.cpu.x = 0;    // X register
        this.cpu.y = 0;    // Y register
        this.cpu.z = false; // Zero flag
        this.cpu.n = false; // Negative flag
        this.errorMessage = null; // Clear any error messages
        
        // Clear instruction and data memory
        // Create new array references to force Lit to re-render inputs
        this.cpu.instructions = new Array(256).fill(0);
        this.cpu.memory = new Array(256).fill(0);
        
        // Increment version counter to force input recreation
        this.cpu.memoryVersion = (this.cpu.memoryVersion || 0) + 1;
        
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
    // Note: reset() should be called before loadProgram() to clear memory and registers
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
            // Remove comments (everything after semicolon only - # is used for immediate values)
            const codeLine = line.split(/;/)[0].trim();
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
            const validInstructions = ['LDA', 'LDX', 'LDY', 'STA', 'STX', 'STY', 'TAX', 'TAY', 'TXA', 'TYA', 'INX', 'INY', 'DEX', 'DEY',
                                      'ADC', 'SBC', 'CMP', 'CPX', 'CPY', 'BEQ', 'BNE', 'BMI', 'BPL', 'JMP', 'BRK', 'CLX', 'CLY'];
            if (!validInstructions.includes(instruction)) {
                errors.push(`Line ${lineNum + 1}: Unknown instruction "${instruction}"`);
                continue;
            }
            
            // Calculate instruction size and check for overflow (6502 instruction sizes)
            let instructionSize = 0;
            // 2-byte instructions (immediate or zero-page): LDA #, LDX #, LDY #, CMP #, CPX #, CPY #, ADC #, SBC #, STA $, STX $, STY $
            // Branch instructions: BEQ, BNE, BMI, BPL (relative branches)
            if (instruction === 'LDA' || instruction === 'LDX' || instruction === 'LDY' || instruction === 'STA' ||
                instruction === 'STX' || instruction === 'STY' || instruction === 'ADC' || instruction === 'SBC' ||
                instruction === 'CMP' || instruction === 'CPX' || instruction === 'CPY' || instruction === 'BEQ' || instruction === 'BNE' || instruction === 'BMI' ||
                instruction === 'BPL' || instruction === 'JMP') {
                instructionSize = 2; // 2-byte instructions
            } else if (instruction === 'TAX' || instruction === 'TAY' || instruction === 'TXA' || instruction === 'TYA' ||
                       instruction === 'INX' || instruction === 'INY' || instruction === 'DEX' || instruction === 'DEY' ||
                       instruction === 'BRK' || instruction === 'CLX' || instruction === 'CLY') {
                instructionSize = 1; // 1-byte instructions
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
            
            // Remove comments (everything after semicolon only - # is used for immediate values)
            const codeLine = line.split(/;/)[0].trim();
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
            
            // Don't remove commas yet - we need them for indexed addressing detection
            // Commas will be handled in the specific instruction handlers
            
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
            
            if (instruction === 'LDA' || instruction === 'LDX' || instruction === 'LDY') {
                console.log(`Processing ${instruction} instruction`);
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires value or address (e.g., ${instruction} #42 or ${instruction} $10)`);
                }
                // Handle indexed addressing where there might be whitespace: LDA $00, X
                // Join parts[1] and parts[2] if parts[1] ends with comma
                let operand = parts[1];
                if (operand.endsWith(',') && parts.length > 2) {
                    operand = operand + parts[2]; // Join $00, and X to get $00,X
                }
                
                // Check if it's zero-page addressing ($address) or immediate (#value or value)
                if (operand.startsWith('$')) {
                    // Check for indexed addressing: LDA $address,X or LDA $address,Y
                    // Use string manipulation to handle $00,X correctly (regex has issues with $00)
                    const commaIndex = operand.indexOf(',');
                    console.log(`  Debug: operand="${operand}", commaIndex=${commaIndex}, instruction="${instruction}"`);
                    if (commaIndex > 0 && instruction === 'LDA') {
                        const addrPart = operand.substring(1, commaIndex); // Get part between $ and ,
                        const indexPart = operand.substring(commaIndex + 1).trim().toUpperCase();
                        console.log(`  Debug: addrPart="${addrPart}", indexPart="${indexPart}"`);
                        if (indexPart === 'X' || indexPart === 'Y') {
                            // Parse address (supports hex with 0x prefix or just hex digits)
                            let addr;
                            if (addrPart.startsWith('0x') || addrPart.startsWith('0X')) {
                                addr = parseInt(addrPart.substring(2), 16);
                            } else {
                                // Try hex first, then decimal
                                addr = parseInt(addrPart, 16);
                                if (isNaN(addr)) {
                                    addr = parseInt(addrPart, 10);
                                }
                            }
                            if (isNaN(addr) || addr < 0 || addr > 255) {
                                throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                            }
                            let opcode;
                            if (indexPart === 'X') {
                                opcode = 0xB5; // LDA $nn,X (6502 zero-page indexed)
                            } else {
                                opcode = 0xB9; // LDA $nn,Y (6502 zero-page indexed, adapted)
                            }
                            console.log(`Assembling ${instruction} $${addr.toString(16).padStart(2, '0')},${indexPart}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                            this.cpu.instructions[address] = opcode;
                            this.cpu.instructions[address + 1] = addr;
                            address += 2;
                        } else {
                            // Not indexed addressing, treat as regular zero-page
                            const addrStr = operand.substring(1);
                            const addr = addrStr.startsWith('0x') ? parseInt(addrStr.substring(2), 16) : parseInt(addrStr, 16);
                            if (isNaN(addr) || addr < 0 || addr > 255) {
                                throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                            }
                            let opcode;
                            if (instruction === 'LDA') {
                                opcode = 0xA5; // LDA $ (6502 zero-page)
                            } else if (instruction === 'LDX') {
                                opcode = 0xA6; // LDX $ (6502 zero-page)
                            } else if (instruction === 'LDY') {
                                opcode = 0xA4; // LDY $ (6502 zero-page)
                            }
                            console.log(`Assembling ${instruction} $${addr.toString(16).padStart(2, '0')}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                            this.cpu.instructions[address] = opcode;
                            this.cpu.instructions[address + 1] = addr;
                            address += 2;
                        }
                    } else {
                        // Zero-page addressing: LDA $address, LDX $address, LDY $address
                        const addrStr = operand.substring(1);
                        const addr = addrStr.startsWith('0x') ? parseInt(addrStr.substring(2), 16) : parseInt(addrStr, 16);
                        if (isNaN(addr) || addr < 0 || addr > 255) {
                            throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                        }
                        let opcode;
                        if (instruction === 'LDA') {
                            opcode = 0xA5; // LDA $ (6502 zero-page)
                        } else if (instruction === 'LDX') {
                            opcode = 0xA6; // LDX $ (6502 zero-page)
                        } else if (instruction === 'LDY') {
                            opcode = 0xA4; // LDY $ (6502 zero-page)
                        }
                        console.log(`Assembling ${instruction} $${addr.toString(16).padStart(2, '0')}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                        this.cpu.instructions[address] = opcode;
                        this.cpu.instructions[address + 1] = addr;
                        address += 2;
                    }
                } else {
                    // Immediate mode: LDA #value, LDX #value, LDY #value
                    // Support both "#value" and "value" syntax (remove # if present)
                    let valueStr = operand;
                    if (valueStr.startsWith('#')) {
                        valueStr = valueStr.substring(1);
                    }
                    const value = this.parseValue(valueStr);
                    // Map to 6502 opcodes: LDA # (A9), LDX # (A2), LDY # (A0)
                    let opcode;
                    if (instruction === 'LDA') {
                        opcode = 0xA9; // LDA # (6502 immediate)
                    } else if (instruction === 'LDX') {
                        opcode = 0xA2; // LDX # (6502 immediate)
                    } else if (instruction === 'LDY') {
                        opcode = 0xA0; // LDY # (6502 immediate)
                    }
                    console.log(`Assembling ${instruction} #${value}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = value;
                    address += 2;
                }
            } else if (instruction === 'INX' || instruction === 'INY') {
                let opcode;
                if (instruction === 'INX') {
                    opcode = 0xE8; // INX (6502)
                } else if (instruction === 'INY') {
                    opcode = 0xC8; // INY (6502)
                }
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'DEX' || instruction === 'DEY') {
                let opcode;
                if (instruction === 'DEX') {
                    opcode = 0xCA; // DEX (6502)
                } else if (instruction === 'DEY') {
                    opcode = 0x88; // DEY (6502)
                }
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'BRK') {
                this.cpu.instructions[address] = 0x00; // BRK opcode (6502 BRK = 0x00)
                address += 1;
            } else if (instruction === 'CLX') {
                const opcode = 0xE2; // CLX - Clear X register (close to INX 0xE8)
                console.log(`Assembling CLX: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'CLY') {
                const opcode = 0xC2; // CLY - Clear Y register (close to INY 0xC8)
                console.log(`Assembling CLY: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'CMP') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: CMP instruction requires value or address (e.g., CMP #42 or CMP $10)`);
                }
                const operand = parts[1];
                
                // Check if it's zero-page addressing ($address) or immediate (#value or value)
                if (operand.startsWith('$')) {
                    // Zero-page addressing: CMP $address
                    const addrStr = operand.substring(1);
                    const addr = addrStr.startsWith('0x') ? parseInt(addrStr.substring(2), 16) : parseInt(addrStr, 16);
                    if (isNaN(addr) || addr < 0 || addr > 255) {
                        throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                    }
                    const opcode = 0xC5; // CMP $ (6502 zero-page)
                    console.log(`Assembling CMP $${addr.toString(16).padStart(2, '0')}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = addr;
                    address += 2;
                } else {
                    // Immediate mode: CMP #value
                    // Support both "#value" and "value" syntax (remove # if present)
                    let valueStr = operand;
                    if (valueStr.startsWith('#')) {
                        valueStr = valueStr.substring(1);
                    }
                    const value = this.parseValue(valueStr);
                    // 6502 CMP # compares accumulator with immediate value
                    const opcode = 0xC9; // CMP # (6502 immediate)
                    console.log(`Assembling CMP #${value}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = value;
                    address += 2;
                }
            } else if (instruction === 'CPX') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: CPX instruction requires value or address (e.g., CPX #42 or CPX $10)`);
                }
                const operand = parts[1];
                
                // Check if it's zero-page addressing ($address) or immediate (#value or value)
                if (operand.startsWith('$')) {
                    // Zero-page addressing: CPX $address
                    const addrStr = operand.substring(1);
                    const addr = addrStr.startsWith('0x') ? parseInt(addrStr.substring(2), 16) : parseInt(addrStr, 16);
                    if (isNaN(addr) || addr < 0 || addr > 255) {
                        throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                    }
                    const opcode = 0xE4; // CPX $ (6502 zero-page)
                    console.log(`Assembling CPX $${addr.toString(16).padStart(2, '0')}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = addr;
                    address += 2;
                } else {
                    // Immediate mode: CPX #value
                    // Support both "#value" and "value" syntax (remove # if present)
                    let valueStr = operand;
                    if (valueStr.startsWith('#')) {
                        valueStr = valueStr.substring(1);
                    }
                    const value = this.parseValue(valueStr);
                    // 6502 CPX # compares X register with immediate value
                    const opcode = 0xE0; // CPX # (6502 immediate)
                    console.log(`Assembling CPX #${value}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = value;
                    address += 2;
                }
            } else if (instruction === 'CPY') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: CPY instruction requires value or address (e.g., CPY #42 or CPY $10)`);
                }
                const operand = parts[1];
                
                // Check if it's zero-page addressing ($address) or immediate (#value or value)
                if (operand.startsWith('$')) {
                    // Zero-page addressing: CPY $address
                    const addrStr = operand.substring(1);
                    const addr = addrStr.startsWith('0x') ? parseInt(addrStr.substring(2), 16) : parseInt(addrStr, 16);
                    if (isNaN(addr) || addr < 0 || addr > 255) {
                        throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                    }
                    const opcode = 0xC4; // CPY $ (6502 zero-page)
                    console.log(`Assembling CPY $${addr.toString(16).padStart(2, '0')}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = addr;
                    address += 2;
                } else {
                    // Immediate mode: CPY #value
                    // Support both "#value" and "value" syntax (remove # if present)
                    let valueStr = operand;
                    if (valueStr.startsWith('#')) {
                        valueStr = valueStr.substring(1);
                    }
                    const value = this.parseValue(valueStr);
                    // 6502 CPY # compares Y register with immediate value
                    const opcode = 0xC0; // CPY # (6502 immediate)
                    console.log(`Assembling CPY #${value}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = value;
                    address += 2;
                }
            } else if (instruction === 'BEQ' || instruction === 'BNE' || instruction === 'BMI' || instruction === 'BPL') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires label or address (e.g., ${instruction} loop)`);
                }
                const labelOrValue = parts[1];
                const targetAddr = this.resolveLabelOrValue(labelOrValue, labels);
                // Calculate relative branch offset (6502 branches are relative)
                const offset = targetAddr - (address + 2);
                if (offset < -128 || offset > 127) {
                    throw new Error(`Line ${lineNum + 1}: Branch target too far (offset ${offset}, must be -128 to 127)`);
                }
                let opcode;
                if (instruction === 'BEQ') {
                    opcode = 0xF0; // BEQ (branch if zero/equal)
                } else if (instruction === 'BNE') {
                    opcode = 0xD0; // BNE (branch if not zero/not equal)
                } else if (instruction === 'BMI') {
                    opcode = 0x30; // BMI (branch if minus/negative)
                } else if (instruction === 'BPL') {
                    opcode = 0x10; // BPL (branch if plus/positive)
                }
                this.cpu.instructions[address] = opcode;
                this.cpu.instructions[address + 1] = offset & 0xFF; // Signed byte
                address += 2;
            } else if (instruction === 'JMP') {
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
            } else if (instruction === 'TAX' || instruction === 'TAY' || instruction === 'TXA' || instruction === 'TYA') {
                let opcode;
                if (instruction === 'TAX') {
                    opcode = 0xAA; // TAX (6502)
                } else if (instruction === 'TAY') {
                    opcode = 0xA8; // TAY (6502)
                } else if (instruction === 'TXA') {
                    opcode = 0x8A; // TXA (6502)
                } else if (instruction === 'TYA') {
                    opcode = 0x98; // TYA (6502)
                }
                this.cpu.instructions[address] = opcode;
                address += 1;
            } else if (instruction === 'ADC') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ADC instruction requires value or address (e.g., ADC #42 or ADC $10)`);
                }
                const operand = parts[1];
                
                // Check if it's zero-page addressing ($address) or immediate (#value or value)
                if (operand.startsWith('$')) {
                    // Zero-page addressing: ADC $address
                    const addrStr = operand.substring(1);
                    const addr = addrStr.startsWith('0x') ? parseInt(addrStr.substring(2), 16) : parseInt(addrStr, 16);
                    if (isNaN(addr) || addr < 0 || addr > 255) {
                        throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                    }
                    const opcode = 0x65; // ADC $ (6502 zero-page)
                    console.log(`Assembling ADC $${addr.toString(16).padStart(2, '0')}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = addr;
                    address += 2;
                } else {
                    // Immediate mode: ADC #value
                    // Support both "#value" and "value" syntax (remove # if present)
                    let valueStr = operand;
                    if (valueStr.startsWith('#')) {
                        valueStr = valueStr.substring(1);
                    }
                    const value = this.parseValue(valueStr);
                    // 6502 ADC # adds to accumulator
                    const opcode = 0x69; // ADC # (6502 immediate)
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = value;
                    address += 2;
                }
            } else if (instruction === 'SBC') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: SBC instruction requires value or address (e.g., SBC #42 or SBC $10)`);
                }
                const operand = parts[1];
                
                // Check if it's zero-page addressing ($address) or immediate (#value or value)
                if (operand.startsWith('$')) {
                    // Zero-page addressing: SBC $address
                    const addrStr = operand.substring(1);
                    const addr = addrStr.startsWith('0x') ? parseInt(addrStr.substring(2), 16) : parseInt(addrStr, 16);
                    if (isNaN(addr) || addr < 0 || addr > 255) {
                        throw new Error(`Line ${lineNum + 1}: Invalid address "${operand}". Must be between $00 and $FF`);
                    }
                    const opcode = 0xE5; // SBC $ (6502 zero-page)
                    console.log(`Assembling SBC $${addr.toString(16).padStart(2, '0')}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = addr;
                    address += 2;
                } else {
                    // Immediate mode: SBC #value
                    // Support both "#value" and "value" syntax (remove # if present)
                    let valueStr = operand;
                    if (valueStr.startsWith('#')) {
                        valueStr = valueStr.substring(1);
                    }
                    const value = this.parseValue(valueStr);
                    // 6502 SBC # subtracts from accumulator
                    const opcode = 0xE9; // SBC # (6502 immediate)
                    this.cpu.instructions[address] = opcode;
                    this.cpu.instructions[address + 1] = value;
                    address += 2;
                }
            } else if (instruction === 'STA' || instruction === 'STX' || instruction === 'STY') {
                if (parts.length < 2) {
                    throw new Error(`Line ${lineNum + 1}: ${instruction} instruction requires address (e.g., ${instruction} $10)`);
                }
                // Handle indexed addressing where there might be whitespace: STA $00, X
                // Join parts[1] and parts[2] if parts[1] ends with comma
                let addrStr = parts[1];
                if (addrStr.endsWith(',') && parts.length > 2) {
                    addrStr = addrStr + parts[2]; // Join $00, and X to get $00,X
                }
                
                // Check for indexed addressing: STA $address,X or STA $address,Y
                // Use string manipulation to handle $00,X correctly
                const commaIndex = addrStr.indexOf(',');
                if (commaIndex > 0 && instruction === 'STA') {
                    const addrPart = addrStr.substring(1, commaIndex); // Get part between $ and ,
                    const indexPart = addrStr.substring(commaIndex + 1).trim().toUpperCase();
                    if (indexPart === 'X' || indexPart === 'Y') {
                        // Parse address (supports hex with 0x prefix or just hex digits)
                        let addr;
                        if (addrPart.startsWith('0x') || addrPart.startsWith('0X')) {
                            addr = parseInt(addrPart.substring(2), 16);
                        } else {
                            // Try hex first, then decimal
                            addr = parseInt(addrPart, 16);
                            if (isNaN(addr)) {
                                addr = parseInt(addrPart, 10);
                            }
                        }
                        if (isNaN(addr) || addr < 0 || addr > 255) {
                            throw new Error(`Line ${lineNum + 1}: Invalid address "${addrStr}". Must be between $00 and $FF`);
                        }
                        let opcode;
                        if (indexPart === 'X') {
                            opcode = 0x95; // STA $nn,X (6502 zero-page indexed)
                        } else {
                            opcode = 0x99; // STA $nn,Y (6502 zero-page indexed, adapted)
                        }
                        console.log(`Assembling ${instruction} $${addr.toString(16).padStart(2, '0')},${indexPart}: opcode=0x${opcode.toString(16).padStart(2, '0')}`);
                        this.cpu.instructions[address] = opcode;
                        this.cpu.instructions[address + 1] = addr;
                        address += 2;
                    } else {
                        // Not indexed addressing, treat as regular zero-page
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
                    }
                } else {
                    // Regular zero-page addressing: STA $address, STX $address, STY $address
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
                }
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
        // Force update to ensure UI reflects flag changes
        this.cpu.requestUpdate();
    }

    // Update status flags for comparison (6502 CMP semantics)
    updateCompareFlags(acc, value) {
        const result = (acc - value) & 0xFF;
        this.cpu.z = (acc === value);
        this.cpu.n = ((result & 0x80) !== 0);
        // Force update to ensure UI reflects flag changes
        this.cpu.requestUpdate();
    }

    // Execute a single instruction (6502)
    async executeStep() {
        if (this.running === false) return null;
        
        // Read instruction from instruction memory
        const instruction = this.cpu.instructions[this.cpu.pc];
        let result = null;
        let pcIncrement = 1;
        
        console.log(`Executing at PC=${this.cpu.pc}, instruction=0x${instruction.toString(16).padStart(2, '0')}`);
        
        // Decode 6502 opcodes
        if (instruction === 0x00) { // BRK - Break/Halt
            const instructionText = `Break`;
            console.log(`  Executing: BRK at PC=${this.cpu.pc}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.printString(); // Print automatically on BRK
            
            // Narrate the printed output
            const printedOutput = this.getPrintedOutput();
            if (printedOutput && printedOutput.trim()) {
                await this.narrateText(`Printed output: ${printedOutput}`);
            } else {
                await this.narrateText(`No printed output`);
            }
            
            this.running = false;
            result = 'BRK';
            pcIncrement = 1;
            // Don't update PC after BRK - we're halting
        }
        // Load instructions (immediate mode)
        else if (instruction === 0xA9) { // LDA # - Load accumulator immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Load Accumulator immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: LDA #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.acc = immediate;
            this.updateStatusFlags(this.cpu.acc);
            result = `LDA #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xA2) { // LDX # - Load X immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Load X register immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: LDX #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.x = immediate;
            this.updateStatusFlags(this.cpu.x);
            result = `LDX #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xA0) { // LDY # - Load Y immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Load Y register immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: LDY #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.y = immediate;
            this.updateStatusFlags(this.cpu.y);
            result = `LDY #${immediate}`;
            pcIncrement = 2;
        }
        // Load instructions (zero-page addressing)
        else if (instruction === 0xA5) { // LDA $ - Load accumulator from zero-page address
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Load Accumulator from address ${addr}`;
            console.log(`  Executing: LDA $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.acc = this.cpu.memory[addr];
            this.cpu.highlightMemory(addr);
            this.updateStatusFlags(this.cpu.acc);
            result = `LDA $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xB5) { // LDA $nn,X - Load accumulator from zero-page indexed with X
            const baseAddr = this.cpu.instructions[this.cpu.pc + 1];
            const xValue = Number(this.cpu.x); // Ensure X is treated as a number
            const effAddr = (baseAddr + xValue) & 0xFF; // Wrap within zero-page
            const instructionText = `Load Accumulator from address ${baseAddr} indexed with X`;
            console.log(`  Executing: LDA $${baseAddr.toString(16).padStart(2, '0')},X (X=${xValue}, effective: $${effAddr.toString(16).padStart(2, '0')})`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.acc = this.cpu.memory[effAddr];
            this.cpu.highlightMemory(effAddr);
            this.updateStatusFlags(this.cpu.acc);
            result = `LDA $${baseAddr.toString(16).padStart(2, '0')},X`;
            pcIncrement = 2;
        }
        else if (instruction === 0xB9) { // LDA $nn,Y - Load accumulator from zero-page indexed with Y
            const baseAddr = this.cpu.instructions[this.cpu.pc + 1];
            const yValue = Number(this.cpu.y); // Ensure Y is treated as a number
            const effAddr = (baseAddr + yValue) & 0xFF; // Wrap within zero-page
            const instructionText = `Load Accumulator from address ${baseAddr} indexed with Y`;
            console.log(`  Executing: LDA $${baseAddr.toString(16).padStart(2, '0')},Y (Y=${yValue}, effective: $${effAddr.toString(16).padStart(2, '0')})`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.acc = this.cpu.memory[effAddr];
            this.cpu.highlightMemory(effAddr);
            this.updateStatusFlags(this.cpu.acc);
            result = `LDA $${baseAddr.toString(16).padStart(2, '0')},Y`;
            pcIncrement = 2;
        }
        else if (instruction === 0xA6) { // LDX $ - Load X from zero-page address
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Load X register from address ${addr}`;
            console.log(`  Executing: LDX $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.x = this.cpu.memory[addr];
            this.cpu.highlightMemory(addr);
            this.updateStatusFlags(this.cpu.x);
            result = `LDX $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xA4) { // LDY $ - Load Y from zero-page address
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Load Y register from address ${addr}`;
            console.log(`  Executing: LDY $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.y = this.cpu.memory[addr];
            this.cpu.highlightMemory(addr);
            this.updateStatusFlags(this.cpu.y);
            result = `LDY $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        // Store instructions (zero page)
        else if (instruction === 0x85) { // STA $ - Store accumulator zero page
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Store Accumulator to address ${addr}`;
            console.log(`  Executing: STA $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.memory[addr] = this.cpu.acc;
            this.cpu.highlightMemory(addr);
            result = `STA $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0x95) { // STA $nn,X - Store accumulator to zero-page indexed with X
            const baseAddr = this.cpu.instructions[this.cpu.pc + 1];
            const xValue = Number(this.cpu.x); // Ensure X is treated as a number
            const effAddr = (baseAddr + xValue) & 0xFF; // Wrap within zero-page
            const instructionText = `Store Accumulator to address ${baseAddr} indexed with X`;
            console.log(`  Executing: STA $${baseAddr.toString(16).padStart(2, '0')},X (X=${xValue}, effective: $${effAddr.toString(16).padStart(2, '0')})`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.memory[effAddr] = this.cpu.acc;
            this.cpu.highlightMemory(effAddr);
            result = `STA $${baseAddr.toString(16).padStart(2, '0')},X`;
            pcIncrement = 2;
        }
        else if (instruction === 0x99) { // STA $nn,Y - Store accumulator to zero-page indexed with Y
            const baseAddr = this.cpu.instructions[this.cpu.pc + 1];
            const yValue = Number(this.cpu.y); // Ensure Y is treated as a number
            const effAddr = (baseAddr + yValue) & 0xFF; // Wrap within zero-page
            const instructionText = `Store Accumulator to address ${baseAddr} indexed with Y`;
            console.log(`  Executing: STA $${baseAddr.toString(16).padStart(2, '0')},Y (Y=${yValue}, effective: $${effAddr.toString(16).padStart(2, '0')})`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.memory[effAddr] = this.cpu.acc;
            this.cpu.highlightMemory(effAddr);
            result = `STA $${baseAddr.toString(16).padStart(2, '0')},Y`;
            pcIncrement = 2;
        }
        else if (instruction === 0x86) { // STX $ - Store X zero page
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Store X register to address ${addr}`;
            console.log(`  Executing: STX $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.memory[addr] = this.cpu.x;
            this.cpu.highlightMemory(addr);
            result = `STX $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0x84) { // STY $ - Store Y zero page
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Store Y register to address ${addr}`;
            console.log(`  Executing: STY $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.memory[addr] = this.cpu.y;
            this.cpu.highlightMemory(addr);
            result = `STY $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        // Compare instructions
        else if (instruction === 0xC9) { // CMP # - Compare accumulator immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Compare Accumulator with immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: CMP #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.updateCompareFlags(this.cpu.acc, immediate);
            result = `CMP #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xC5) { // CMP $ - Compare accumulator with zero-page memory
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const memValue = this.cpu.memory[addr];
            const instructionText = `Compare Accumulator with address ${addr}`;
            console.log(`  Executing: CMP $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.updateCompareFlags(this.cpu.acc, memValue);
            this.cpu.highlightMemory(addr);
            result = `CMP $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xE0) { // CPX # - Compare X register immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Compare X register with immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: CPX #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.updateCompareFlags(this.cpu.x, immediate);
            result = `CPX #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xE4) { // CPX $ - Compare X register with zero-page memory
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const memValue = this.cpu.memory[addr];
            const instructionText = `Compare X register with address ${addr}`;
            console.log(`  Executing: CPX $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.updateCompareFlags(this.cpu.x, memValue);
            this.cpu.highlightMemory(addr);
            result = `CPX $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xC0) { // CPY # - Compare Y register immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Compare Y register with immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: CPY #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.updateCompareFlags(this.cpu.y, immediate);
            result = `CPY #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xC4) { // CPY $ - Compare Y register with zero-page memory
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const memValue = this.cpu.memory[addr];
            const instructionText = `Compare Y register with address ${addr}`;
            console.log(`  Executing: CPY $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.updateCompareFlags(this.cpu.y, memValue);
            this.cpu.highlightMemory(addr);
            result = `CPY $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        // Arithmetic instructions (immediate mode)
        else if (instruction === 0x69) { // ADC # - Add immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Add with Carry immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: ADC #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            const sum = this.cpu.acc + immediate;
            this.cpu.acc = sum & 0xFF;
            this.updateStatusFlags(this.cpu.acc);
            result = `ADC #${immediate}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xE9) { // SBC # - Subtract immediate
            const immediate = this.cpu.instructions[this.cpu.pc + 1];
            const instructionText = `Subtract with Carry immediate ${this.hexToSpeech(immediate)}`;
            console.log(`  Executing: SBC #${immediate}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            const diff = this.cpu.acc - immediate;
            this.cpu.acc = diff & 0xFF;
            this.updateStatusFlags(this.cpu.acc);
            result = `SBC #${immediate}`;
            pcIncrement = 2;
        }
        // Arithmetic instructions (zero-page addressing)
        else if (instruction === 0x65) { // ADC $ - Add from zero-page address
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const value = this.cpu.memory[addr];
            const instructionText = `Add with Carry from address ${addr}`;
            console.log(`  Executing: ADC $${addr.toString(16).padStart(2, '0')} (value=${value})`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.highlightMemory(addr);
            const sum = this.cpu.acc + value;
            this.cpu.acc = sum & 0xFF;
            this.updateStatusFlags(this.cpu.acc);
            result = `ADC $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        else if (instruction === 0xE5) { // SBC $ - Subtract from zero-page address
            const addr = this.cpu.instructions[this.cpu.pc + 1];
            const value = this.cpu.memory[addr];
            const instructionText = `Subtract with Carry from address ${addr}`;
            console.log(`  Executing: SBC $${addr.toString(16).padStart(2, '0')} (value=${value})`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.highlightMemory(addr);
            const diff = this.cpu.acc - value;
            this.cpu.acc = diff & 0xFF;
            this.updateStatusFlags(this.cpu.acc);
            result = `SBC $${addr.toString(16).padStart(2, '0')}`;
            pcIncrement = 2;
        }
        // Increment/Decrement instructions
        else if (instruction === 0xE8) { // INX - Increment X
            const instructionText = `Increment X register`;
            console.log(`  Executing: INX`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.x = (this.cpu.x + 1) & 0xFF;
            this.updateStatusFlags(this.cpu.x);
            result = 'INX';
            pcIncrement = 1;
        }
        else if (instruction === 0xC8) { // INY - Increment Y
            const instructionText = `Increment Y register`;
            console.log(`  Executing: INY`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.y = (this.cpu.y + 1) & 0xFF;
            this.updateStatusFlags(this.cpu.y);
            result = 'INY';
            pcIncrement = 1;
        }
        else if (instruction === 0xCA) { // DEX - Decrement X
            const instructionText = `Decrement X register`;
            console.log(`  Executing: DEX`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.x = (this.cpu.x - 1) & 0xFF;
            this.updateStatusFlags(this.cpu.x);
            result = 'DEX';
            pcIncrement = 1;
        }
        else if (instruction === 0x88) { // DEY - Decrement Y
            const instructionText = `Decrement Y register`;
            console.log(`  Executing: DEY`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.y = (this.cpu.y - 1) & 0xFF;
            this.updateStatusFlags(this.cpu.y);
            result = 'DEY';
            pcIncrement = 1;
        }
        // Transfer instructions
        else if (instruction === 0xAA) { // TAX - Transfer accumulator to X
            const instructionText = `Transfer Accumulator to X register`;
            console.log(`  Executing: TAX`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.x = this.cpu.acc;
            this.updateStatusFlags(this.cpu.x);
            result = 'TAX';
            pcIncrement = 1;
        }
        else if (instruction === 0xA8) { // TAY - Transfer accumulator to Y
            const instructionText = `Transfer Accumulator to Y register`;
            console.log(`  Executing: TAY`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.y = this.cpu.acc;
            this.updateStatusFlags(this.cpu.y);
            result = 'TAY';
            pcIncrement = 1;
        }
        else if (instruction === 0x8A) { // TXA - Transfer X to accumulator
            const instructionText = `Transfer X register to Accumulator`;
            console.log(`  Executing: TXA`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.acc = this.cpu.x;
            this.updateStatusFlags(this.cpu.acc);
            result = 'TXA';
            pcIncrement = 1;
        }
        else if (instruction === 0x98) { // TYA - Transfer Y to accumulator
            const instructionText = `Transfer Y register to Accumulator`;
            console.log(`  Executing: TYA`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.acc = this.cpu.y;
            this.updateStatusFlags(this.cpu.acc);
            result = 'TYA';
            pcIncrement = 1;
        }
        // Clear instructions (zero out registers)
        else if (instruction === 0xE2) { // CLX - Clear X register (close to INX 0xE8)
            const instructionText = `Clear X register`;
            console.log(`  Executing: CLX`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.x = 0;
            this.updateStatusFlags(this.cpu.x);
            result = 'CLX';
            pcIncrement = 1;
        }
        else if (instruction === 0xC2) { // CLY - Clear Y register (close to INY 0xC8)
            const instructionText = `Clear Y register`;
            console.log(`  Executing: CLY`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.y = 0;
            this.updateStatusFlags(this.cpu.y);
            result = 'CLY';
            pcIncrement = 1;
        }
        // Branch instructions (relative) - 6502 branches are relative to the instruction after the branch
        else if (instruction === 0xF0) { // BEQ - Branch if equal (zero flag set)
            const offset = this.cpu.instructions[this.cpu.pc + 1];
            const signedOffset = (offset & 0x80) ? (offset - 256) : offset; // Sign extend
            // Calculate destination address: PC + 2 (after branch instruction) + offset
            const destAddr = (this.cpu.pc + 2 + signedOffset) & 0xFF;
            const instructionText = `Branch if Equal address ${this.hexToSpeech(destAddr)}`;
            console.log(`  Executing: BEQ ${signedOffset > 0 ? '+' : ''}${signedOffset}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            if (this.cpu.z) {
                const newPC = destAddr;
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
            // Calculate destination address: PC + 2 (after branch instruction) + offset
            const destAddr = (this.cpu.pc + 2 + signedOffset) & 0xFF;
            const instructionText = `Branch if Minus address ${this.hexToSpeech(destAddr)}`;
            console.log(`  Executing: BMI ${signedOffset > 0 ? '+' : ''}${signedOffset}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            if (this.cpu.n) {
                const newPC = destAddr;
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
            // Calculate destination address: PC + 2 (after branch instruction) + offset
            const destAddr = (this.cpu.pc + 2 + signedOffset) & 0xFF;
            const instructionText = `Branch if Plus address ${this.hexToSpeech(destAddr)}`;
            console.log(`  Executing: BPL ${signedOffset > 0 ? '+' : ''}${signedOffset}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            if (!this.cpu.n) {
                const newPC = destAddr;
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
            const instructionText = `Jump to address ${addr}`;
            console.log(`  Executing: JMP $${addr.toString(16).padStart(2, '0')}`);
            await this.narrateInstruction(this.cpu.pc, instructionText);
            this.cpu.pc = addr;
            pcIncrement = 0; // PC already updated
            result = `JMP $${addr.toString(16).padStart(2, '0')}`;
        }
        // Unknown instruction
        else {
            const errorMsg = `Invalid instruction 0x${instruction.toString(16).padStart(2, '0')}`;
            console.log(`  ERROR: ${errorMsg} - halting CPU`);
            this.running = false;
            this.errorMessage = errorMsg;
            result = `ERROR: ${errorMsg}`;
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
                n: this.cpu.n
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

    // Get the most recently printed output (last line added to output)
    getPrintedOutput() {
        const lines = this.output.trim().split('\n');
        return lines.length > 0 ? lines[lines.length - 1] : '';
    }

    // Narrate arbitrary text (helper method)
    async narrateText(text) {
        if (!this.narrateEnabled) {
            return Promise.resolve();
        }

        // Check if speech synthesis is available
        if (!('speechSynthesis' in window)) {
            return Promise.resolve();
        }

        console.log(`[NARRATION] Speaking: "${text}"`);
        
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8; // Slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onstart = () => {
                // Speech started
            };
            utterance.onend = () => {
                resolve();
            };
            utterance.onerror = (event) => {
                console.error(`[NARRATION] Error speaking: "${text}"`, event);
                resolve(); // Resolve even on error to continue execution
            };
            
            window.speechSynthesis.speak(utterance);
        });
    }



    // Start continuous execution
    start() {
        if (this.running) return;
        
        this.running = true;
        
        // If narration is enabled, use async execution that waits for speech
        if (this.narrateEnabled) {
            this.runWithNarration();
        } else {
            // Normal clock-based execution when narration is disabled
            this.clockInterval = setInterval(async () => {
                if (!this.running) {
                    this.stop();
                    return;
                }
                const result = await this.executeStep();
                // If executeStep returns null (halted) or the program has halted, stop execution
                if (result === null || !this.running) {
                    this.stop();
                    return;
                }
            }, this.clockSpeed);
        }
    }

    // Run execution with narration - waits for each instruction's speech to complete
    async runWithNarration() {
        while (this.running) {
            const result = await this.executeStep();
            // If executeStep returns null (halted) or the program has halted, stop execution
            if (result === null || !this.running) {
                this.stop();
                return;
            }
            // Small delay between instructions for visual clarity (even when narrating)
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Stop execution
    stop() {
        this.running = false;
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        // Stop any ongoing narration
        this.stopNarration();
    }

    // Execute one step
    async step() {
        if (!this.running) {
            this.running = true;
        }
        return await this.executeStep();
    }

    // Load the Hello program (6502)
    loadHelloProgram() {
        this.reset();
        // Store characters to memory using STA
        const helloProgram = `LDA #72        ; 'H'
STA $00
LDA #101       ; 'e'
STA $01
LDA #108       ; 'l'
STA $02
STA $03        ; 'l' again
LDA #111       ; 'o'
STA $04
BRK`;
        this.loadProgram(helloProgram);
    }

    // Load the Hello World program using DATA instruction
    loadHelloWorldProgram() {
        this.reset();
        const helloWorldProgram = `BRK
DATA 'Hello World!'`;
        this.loadProgram(helloWorldProgram);
    }

    // Load the Hi program - simple program to print "Hi" (6502)
    loadHiProgram() {
        this.reset();
        const hiProgram = `LDA #'H'
STA $00
LDA #'i'
STA $01
BRK`;
        this.loadProgram(hiProgram);
    }

    // Load the Add Sample program - demonstrates loading, adding, and storing (6502)
    loadAddSample() {
        this.reset();
        // Demonstrates immediate loading and addition: load 27, add 15, store result (42)
        const addSampleProgram = `LDA #27       ; Load 27 into accumulator
ADC #15        ; Add 15 (result = 42)
STA $00        ; Store result to memory[0] (42 = '*')
BRK`;
        this.loadProgram(addSampleProgram);
    }

    // Load the Uppercase Sample program - converts lowercase letter to uppercase (6502)
    loadUppercaseSample() {
        this.reset();
        // Load 0x70 (lowercase 'p') into accumulator
        // Compare to 'a' (0x61) - if less than, it's already uppercase or not a letter
        // If >= 'a', subtract 0x20 to convert to uppercase
        const uppercaseProgram = `LDA #'p'     ; Load 'p' into accumulator
CMP #'a'     ; Compare with 'a'
BMI skip     ; Branch if minus (less than)
SBC #0x20    ; Subtract 0x20 to convert to uppercase
skip:
BRK`;
        this.loadProgram(uppercaseProgram);
    }

    // Load the Uppercase String Sample program - converts a string to uppercase using indexed addressing
    loadUppercaseStringSample() {
        this.reset();
        // Uses DATA to initialize string, then loops through converting each character
        // Demonstrates indexed addressing (LDA $00,X and STA $00,X)
        const uppercaseStringProgram = `CLX            ; Clear X register (index starts at 0)
loop:
LDA $00,X      ; Load character at memory[$00 + X] into accumulator
BEQ done       ; Branch if zero (null terminator found)
CMP #'a'       ; Compare with lowercase 'a'
BMI cont       ; Branch if minus (less than 'a', already uppercase or not a letter)
SBC #0x20      ; Subtract 0x20 to convert to uppercase
STA $00,X      ; Store converted character back to memory[$00 + X]
cont:
INX            ; Increment X to next character
JMP loop       ; Jump back to loop
done:
BRK            ; Stop and print converted string
DATA 'Hello'`;
        this.loadProgram(uppercaseStringProgram);
    }

    // Load the Simple Sample program - demonstrates basic register operations (6502)
    loadSimpleSample() {
        this.reset();
        // Simple program: zero X, increment X twice
        const simpleProgram = `CLX            ; Clear X register
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
            trace: this.executionTrace,
            errorMessage: this.errorMessage
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
