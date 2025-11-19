import {html, css, LitElement} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';
import { msg } from 'https://cdn.jsdelivr.net/npm/@lit/localize@0.12.2/lit-localize.min.js';
import { repeat } from 'https://cdn.jsdelivr.net/npm/lit-html@2.7.4/directives/repeat.js';

// https://stackoverflow.com/questions/68614776/using-lit-with-javascript-and-no-build-tools

export class CDC6504CPU extends LitElement {

  static get properties() {
    return {
      running: { type: Boolean },
      memory: { type: Array },
      instructions: { type: Array },
      // 6502 Register properties
      pc: { type: Number },
      acc: { type: Number },  // Accumulator (A register)
      x: { type: Number },    // X register
      y: { type: Number },    // Y register
      // Status flags
      z: { type: Boolean },   // Zero flag
      n: { type: Boolean },   // Negative flag
      c: { type: Boolean },   // Carry flag
      mode: { type: Number }, // Error mode
      // Memory highlighting
      highlightedMemory: { type: Array },
      // Responsive layout
      isMobile: { type: Boolean }
    }
  }

  constructor() {
    super();
    this.running = false;
    this.memory = [];
    this.instructions = [];
    
    // Initialize 6502 registers
    this.pc = 0;
    this.acc = 0;  // Accumulator
    this.x = 0;    // X register
    this.y = 0;    // Y register
    // Initialize status flags
    this.z = false;  // Zero flag
    this.n = false;  // Negative flag
    this.c = false;  // Carry flag
    this.mode = 0;   // Error mode
    
    // Initialize memory highlighting
    this.highlightedMemory = [];
    
    // Initialize responsive layout
    this.isMobile = window.innerWidth <= 1000;
    
    for (let i = 0; i < 256; i++) {
      this.memory.push(0);
    }
    for (let i = 0; i < 256; i++) {
      this.instructions.push(0);
    }
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize.bind(this));
  }



  changeInstruction(index) {
    return (e) => {
      let value = e.target.value;
      console.log("changeInstruction", index, value);
      
      let updated = false;
      
      // Handle binary input (0b format or pure binary)
      if (value.startsWith('0b')) {
        const binaryValue = value.substring(2);
        const numValue = parseInt(binaryValue, 2);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
          this.instructions[index] = numValue;
          updated = true;
        }
      } else if (/^[01]+$/.test(value)) {
        // Pure binary string (only 0s and 1s)
        const numValue = parseInt(value, 2);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
          this.instructions[index] = numValue;
          updated = true;
        }
      } else if (value.startsWith('0x')) {
        // Handle hex input
        const hexValue = value.substring(2);
        const numValue = parseInt(hexValue, 16);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
          this.instructions[index] = numValue;
          updated = true;
        }
      } else {
        // Handle decimal input
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
          this.instructions[index] = numValue;
          updated = true;
        }
      }
      
      // Trigger re-render to update tooltips and displays
      if (updated) {
        this.requestUpdate();
      }
    }
  }

  changeMemory (index) {
    return (e) => {
      let value = e.target.value;
      // Handle hex input (0x format)
      if (value.startsWith('0x')) {
        const hexValue = value.substring(2);
        const numValue = parseInt(hexValue, 16);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
          this.memory[index] = numValue;
        }
      }
      // Handle ASCII character input
      else if (value.length === 1) {
        const charCode = value.charCodeAt(0);
        if (charCode >= 0 && charCode <= 255) {
          this.memory[index] = charCode;
        }
      } else if (value.length === 0) {
        // Empty input means space (ASCII 32)
        this.memory[index] = 32;
      }
    }
  }

  changePC(e) {
    let value = e.target.value;
    if (value.startsWith('0x')) {
      value = value.substring(2);
    }
    const numValue = parseInt(value, 16);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
      this.pc = numValue;
    }
  }

  changeMode(e) {
    let value = e.target.value;
    if (value.startsWith('0x')) {
      value = value.substring(2);
    }
    const numValue = parseInt(value, 16);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 15) {
      this.mode = numValue;
    }
  }

  // 6502 Register change handlers
  changeAcc(e) {
    let value = e.target.value;
    // Handle hex input (0x format)
    if (value.startsWith('0x')) {
      const hexValue = value.substring(2);
      const numValue = parseInt(hexValue, 16);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
        this.acc = numValue;
        this.updateStatusFlags(this.acc);
      }
    }
    // Handle ASCII character input
    else if (value.length === 1) {
      const charCode = value.charCodeAt(0);
      if (charCode >= 0 && charCode <= 255) {
        this.acc = charCode;
        this.updateStatusFlags(this.acc);
      }
    } else if (value.length === 0) {
      // Empty input means space (ASCII 32)
      this.acc = 32;
      this.updateStatusFlags(this.acc);
    }
  }

  changeX(e) {
    let value = e.target.value;
    // Handle hex input (0x format)
    if (value.startsWith('0x')) {
      const hexValue = value.substring(2);
      const numValue = parseInt(hexValue, 16);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
        this.x = numValue;
        this.updateStatusFlags(this.x);
      }
    }
    // Handle ASCII character input
    else if (value.length === 1) {
      const charCode = value.charCodeAt(0);
      if (charCode >= 0 && charCode <= 255) {
        this.x = charCode;
        this.updateStatusFlags(this.x);
      }
    } else if (value.length === 0) {
      // Empty input means space (ASCII 32)
      this.x = 32;
      this.updateStatusFlags(this.x);
    }
  }

  changeY(e) {
    let value = e.target.value;
    // Handle hex input (0x format)
    if (value.startsWith('0x')) {
      const hexValue = value.substring(2);
      const numValue = parseInt(hexValue, 16);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
        this.y = numValue;
        this.updateStatusFlags(this.y);
      }
    }
    // Handle ASCII character input
    else if (value.length === 1) {
      const charCode = value.charCodeAt(0);
      if (charCode >= 0 && charCode <= 255) {
        this.y = charCode;
        this.updateStatusFlags(this.y);
      }
    } else if (value.length === 0) {
      // Empty input means space (ASCII 32)
      this.y = 32;
      this.updateStatusFlags(this.y);
    }
  }

  // Status flag change handlers
  changeZ(e) {
    this.z = e.target.checked;
  }

  changeN(e) {
    this.n = e.target.checked;
  }

  changeC(e) {
    this.c = e.target.checked;
  }

  // Update status flags based on value (6502 style)
  updateStatusFlags(value) {
    this.z = (value === 0);
    this.n = ((value & 0x80) !== 0); // Negative flag (bit 7 set)
    // Carry flag is not automatically updated by register changes
  }

  handleResize() {
    this.isMobile = window.innerWidth <= 1000;
  }

  blurAcc(e) {
    e.target.value = `0x${this.toHex(this.acc)}`;
  }

  blurX(e) {
    e.target.value = `0x${this.toHex(this.x)}`;
  }

  blurY(e) {
    e.target.value = `0x${this.toHex(this.y)}`;
  }

  blurMemory(index) {
    return (e) => {
      console.log("blurMemory called for index", index, "value:", this.memory[index]);
      e.target.value = `0x${this.toHex(this.memory[index])}`;
    }
  }

  toHex(value) {
    return ('0000' + value.toString(16).toUpperCase()).slice(-2);
  }

  toBinary(value) {
    return ('00000000' + value.toString(2).toUpperCase()).slice(-8);
  }

  toChar(value) {
    // Convert numeric value to printable ASCII character
    // If value is 0, show 0x00. If not printable, show '?'
    if (value === 0) return '0x00';
    if (value >= 32 && value <= 126) {
      return String.fromCharCode(value);
    }
    return '?';
  }

  disassembleInstruction(instruction) {
    // Disassemble a single 6502 instruction byte
    // 1-byte instructions
    if (instruction === 0x00) return "BRK";
    if (instruction === 0x02) return "CLR A";
    if (instruction === 0x12) return "CLR X";
    if (instruction === 0x22) return "CLR Y";
    if (instruction === 0xE8) return "INX";
    if (instruction === 0xC8) return "INY";
    if (instruction === 0xCA) return "DEX";
    if (instruction === 0x88) return "DEY";
    if (instruction === 0xAA) return "TAX";
    if (instruction === 0xA8) return "TAY";
    if (instruction === 0x8A) return "TXA";
    if (instruction === 0x98) return "TYA";
    
    // 2-byte instructions (immediate or zero-page)
    // These will show as needing an operand
    if (instruction === 0xA9) return "LDA #";
    if (instruction === 0xA2) return "LDX #";
    if (instruction === 0xA0) return "LDY #";
    if (instruction === 0xA5) return "LDA $";
    if (instruction === 0xA6) return "LDX $";
    if (instruction === 0xA4) return "LDY $";
    if (instruction === 0x85) return "STA $";
    if (instruction === 0x86) return "STX $";
    if (instruction === 0x84) return "STY $";
    if (instruction === 0xC9) return "CMP #";
    if (instruction === 0x69) return "ADC #";
    if (instruction === 0xE9) return "SBC #";
    if (instruction === 0x65) return "ADC $";
    if (instruction === 0xE5) return "SBC $";
    if (instruction === 0xF0) return "BEQ";
    if (instruction === 0x30) return "BMI";
    if (instruction === 0x10) return "BPL";
    if (instruction === 0x4C) return "JMP $";
    
    return "???";
  }

  getRegisterName(regNum) {
    // 6502 registers: 0=ACC, 1=X, 2=Y (limited set for now)
    const registers = ['ACC', 'X', 'Y'];
    return registers[regNum] || `R${regNum}`;
  }

  getTooltipText(value, address) {
    let tooltip = `Address: 0x${this.toHex(address)}`;
    tooltip += `\nValue: 0x${this.toHex(value)} (${value})`;
    
    // Add ASCII character info if it's a printable character
    if (value >= 32 && value <= 126) {
      tooltip += `\nASCII: '${String.fromCharCode(value)}'`;
    } else if (value === 0) {
      tooltip += `\nASCII: null terminator`;
    } else if (value < 32) {
      tooltip += `\nASCII: control character`;
    } else {
      tooltip += `\nASCII: non-printable`;
    }
    
    // Add instruction disassembly if it's a valid instruction
    const disassembly = this.disassembleInstruction(value);
    if (disassembly !== "Invalid instruction") {
      tooltip += `\nInstruction: ${disassembly}`;
    }
    
    return tooltip;
  }

  getAriaLabel(value, address) {
    let ariaLabel = `Instruction memory address 0x${this.toHex(address)}, value 0x${this.toHex(value)} (${value})`;
    
    // Add ASCII character info if it's a printable character
    if (value >= 32 && value <= 126) {
      ariaLabel += `, ASCII character ${String.fromCharCode(value)}`;
    } else if (value === 0) {
      ariaLabel += `, null terminator`;
    } else if (value < 32) {
      ariaLabel += `, control character`;
    } else {
      ariaLabel += `, non-printable character`;
    }
    
    // Add instruction disassembly if it's a valid instruction
    const disassembly = this.disassembleInstruction(value);
    if (disassembly !== "Invalid instruction") {
      ariaLabel += `, disassembles to ${disassembly}`;
    } else {
      ariaLabel += `, invalid instruction`;
    }
    
    return ariaLabel;
  }

  // Method to highlight a memory address
  highlightMemory(address) {
    // Clear all previous highlights and highlight only the most recent address
    this.highlightedMemory = [address];
    this.requestUpdate();
  }

  // Method to clear memory highlighting
  clearMemoryHighlighting() {
    this.highlightedMemory = [];
    this.requestUpdate();
  }



  static get styles() {
    return css`
      :host {
        --breakpoint-width: 1000px;
        display: block;
        font-family: Arial, sans-serif;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .mb-3 {
        margin-bottom: 1rem;
      }
      
      .text-muted {
        color: #6c757d;
        font-size: 0.875rem;
      }
      
      .font-monospace {
        font-family: 'Courier New', Courier, monospace;
      }
      
      .register-input {
        min-width: 4ch !important;
        width: 4ch !important;
        border: 1px solid #ced4da;
        border-radius: 0.375rem;
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
        font-family: 'Courier New', Courier, monospace;
      }
      
      .error-mode {
        background-color: #f8d7da !important;
        border-color: #dc3545 !important;
        color: #721c24 !important;
      }
      
      .form-control {
        display: block;
        width: 100%;
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 400;
        line-height: 1.5;
        color: #212529;
        background-color: #fff;
        background-clip: padding-box;
        border: 1px solid #ced4da;
        border-radius: 0.375rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      }
      
      .form-control-sm {
        min-height: calc(1.5em + 0.5rem + 2px);
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        border-radius: 0.25rem;
      }
      
      .bg-warning {
        background-color: #ffc107 !important;
        color: #000 !important;
        font-weight: bold;
      }
      
      .bg-memory-access {
        background-color: #28a745 !important;
        color: #fff !important;
        font-weight: bold;
      }
      
      .tooltip {
        position: relative;
        display: inline-block;
      }
      
      .tooltip .tooltiptext {
        visibility: hidden;
        width: 200px;
        background-color: #333;
        color: #fff;
        text-align: left;
        border-radius: 6px;
        padding: 8px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -100px;
        opacity: 0;
        transition: opacity 0.3s;
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        white-space: pre-line;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      
      .tooltip .tooltiptext::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
      }
      
      .tooltip:hover .tooltiptext {
        visibility: visible;
        opacity: 1;
      }
      
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
      }
      
      li {
        margin-bottom: 2px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.875rem;
      }
      
      li input {
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
        padding: 2px 4px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.875rem;
      }
      
      p {
        margin: 0 0 0.5rem 0;
        font-weight: bold;
      }
      
      strong {
        font-weight: bold;
      }
      
      @media (max-width: 1000px) {
        .container {
          padding: 10px;
        }
        
        .instructions-list, .memory-list {
          max-height: 300px;
          overflow-y: auto;
        }
      }
    `;
  }

  render() {
    return html`
          <div class="container">
              
              <!-- 6502 Register Section -->
              <div class="mb-3">
                <div style="display: flex; flex-direction: ${this.isMobile ? 'column' : 'row'}; gap: ${this.isMobile ? '0.25rem' : '1rem'}; ${this.isMobile ? 'border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);' : ''} padding: ${this.isMobile ? '0.75rem' : '10px'};">
                  <div style="${this.isMobile ? 'border: none; box-shadow: none; margin-bottom: 0.25rem;' : 'border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);'}">
                    <div style="padding: ${this.isMobile ? '0.25rem' : '1rem'};">
                      <div style="display: flex; gap: 1rem;">
                        <div>
                          <small class="text-muted">PC:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.pc)}" @input=${this.changePC}>
                        </div>
                        <div>
                          <small class="text-muted">MODE:</small><br>
                          <input type="text" size="2" class="font-monospace register-input ${this.mode >= 1 ? 'error-mode' : ''}" value="0x${this.toHex(this.mode)}" @input=${this.changeMode}>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style="${this.isMobile ? 'border: none; box-shadow: none; margin-bottom: 0.25rem;' : 'border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);'}">
                    <div style="padding: ${this.isMobile ? '0.25rem' : '1rem'};">
                      <div style="display: flex; gap: 0.5rem;">
                        <div>
                          <small class="text-muted">ACC:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.acc)}" @input=${this.changeAcc} @blur=${this.blurAcc}>
                        </div>
                        <div>
                          <small class="text-muted">X:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.x)}" @input=${this.changeX} @blur=${this.blurX}>
                        </div>
                        <div>
                          <small class="text-muted">Y:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.y)}" @input=${this.changeY} @blur=${this.blurY}>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style="${this.isMobile ? 'border: none; box-shadow: none; margin-bottom: 0.25rem;' : 'border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);'}">
                    <div style="padding: ${this.isMobile ? '0.25rem' : '1rem'};">
                      <div style="display: flex; gap: 0.5rem;">
                        <div>
                          <small class="text-muted">Z:</small><br>
                          <input type="checkbox" ${this.z ? 'checked' : ''} @change=${this.changeZ} style="width: 20px; height: 20px;">
                        </div>
                        <div>
                          <small class="text-muted">N:</small><br>
                          <input type="checkbox" ${this.n ? 'checked' : ''} @change=${this.changeN} style="width: 20px; height: 20px;">
                        </div>
                        <div>
                          <small class="text-muted">C:</small><br>
                          <input type="checkbox" ${this.c ? 'checked' : ''} @change=${this.changeC} style="width: 20px; height: 20px;">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: row; gap: 1rem;">
                <div style="flex: 1;">
                  <p><strong>Instructions</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.instructions,
                      (word, index) => this.isMobile ? 
                        (index>=0 && index<=31) ? html`
                        <li><span class="${index === this.pc ? 'bg-warning' : ''}">0x${this.toHex(index)}:</span> <div class="tooltip"><input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)} aria-label="${this.getAriaLabel(word, index)}"><span class="tooltiptext">${this.getTooltipText(word, index)}</span></div></li>
                        ` : html``
                        :
                        (index>=0 && index<=15) ? html`
                        <li><span class="${index === this.pc ? 'bg-warning' : ''}">0x${this.toHex(index)}:</span> <div class="tooltip"><input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)} aria-label="${this.getAriaLabel(word, index)}"><span class="tooltiptext">${this.getTooltipText(word, index)}</span></div></li>
                        ` : html``
                    )}
                  </ul>
                </div>
                ${!this.isMobile ? html`
                <div style="flex: 1;">
                  <p><strong>Instructions</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.instructions,
                      (word, index) =>                       (index>=16 && index<=31) ? html`
                      <li><span class="${index === this.pc ? 'bg-warning' : ''}">0x${this.toHex(index)}:</span> <div class="tooltip"><input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)} aria-label="${this.getAriaLabel(word, index)}"><span class="tooltiptext">${this.getTooltipText(word, index)}</span></div></li>
                      ` : html``
                    )}
                  </ul>
                </div>
                ` : html``}
                <div style="flex: 1;">
                  <p><strong>Memory</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.memory,
                      (word, index) => this.isMobile ? 
                        (index>=0 && index<=31) ? html`
                        <li>0x${this.toHex(index)}: <input type="text" size="4" value="0x${this.toHex(word)}" @input=${this.changeMemory(index)} @blur=${this.blurMemory(index)}></li>
                        ` : html``
                        :
                        (index>=0 && index<=15) ? html`
                        <li><span class="${this.highlightedMemory.includes(index) ? 'bg-memory-access' : ''}">0x${this.toHex(index)}:</span> <input type="text" size="4" value="0x${this.toHex(word)}" @input=${this.changeMemory(index)} @blur=${this.blurMemory(index)}></li>
                        ` : html``
                    )}
                  </ul>
                </div>
                ${!this.isMobile ? html`
                <div style="flex: 1;">
                  <p><strong>Memory</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.memory,
                      (word, index) =>                         (index>=16 && index<=31) ? html`
                        <li><span class="${this.highlightedMemory.includes(index) ? 'bg-memory-access' : ''}">0x${this.toHex(index)}:</span> <input type="text" size="4" value="0x${this.toHex(word)}" @input=${this.changeMemory(index)} @blur=${this.blurMemory(index)}></li>
                        ` : html``
                    )}
                  </ul>
                </div>
                ` : html``}
              </div>
    </div>
    `;
  }
}

customElements.define('cdc6504-cpu', CDC6504CPU);

