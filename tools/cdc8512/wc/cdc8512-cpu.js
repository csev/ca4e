import {html, css, LitElement} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';
import { msg } from 'https://cdn.jsdelivr.net/npm/@lit/localize@0.12.2/lit-localize.min.js';
import { repeat } from 'https://cdn.jsdelivr.net/npm/lit-html@2.7.4/directives/repeat.js';

// https://stackoverflow.com/questions/68614776/using-lit-with-javascript-and-no-build-tools

export class CDC8512CPU extends LitElement {

  static get properties() {
    return {
      running: { type: Boolean },
      memory: { type: Array },
      instructions: { type: Array },
      // Register properties
      pc: { type: Number },
      comparison: { type: String },
      mode: { type: Number },
      a0: { type: Number },
      a1: { type: Number },
      a2: { type: Number },
      a3: { type: Number },
      x0: { type: Number },
      x1: { type: Number },
      x2: { type: Number },
      x3: { type: Number },
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
    
    // Initialize registers
    this.pc = 0;
    this.comparison = "=";
    this.mode = 0;
    this.a0 = 0;
    this.a1 = 0;
    this.a2 = 0;
    this.a3 = 0;
    this.x0 = 0;
    this.x1 = 0;
    this.x2 = 0;
    this.x3 = 0;
    
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

  changeComparison(e) {
    this.comparison = e.target.value;
  }

  changeA0(e) {
    let value = e.target.value;
    if (value.startsWith('0x')) {
      value = value.substring(2);
    }
    const numValue = parseInt(value, 16);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
      this.a0 = numValue;
      // Hardware emulation: Load value from memory address A0 into X0 when A0 changes
      this.x0 = this.memory[this.a0];
    }
  }

  changeA1(e) {
    let value = e.target.value;
    if (value.startsWith('0x')) {
      value = value.substring(2);
    }
    const numValue = parseInt(value, 16);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
      this.a1 = numValue;
      // Hardware emulation: Load value from memory address A1 into X1 when A1 changes
      this.x1 = this.memory[this.a1];
    }
  }

  changeA2(e) {
    let value = e.target.value;
    if (value.startsWith('0x')) {
      value = value.substring(2);
    }
    const numValue = parseInt(value, 16);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
      this.a2 = numValue;
      // Hardware emulation: Store X2 value to memory address A2 when value changes
      this.memory[this.a2] = this.x2;
    }
  }

  changeA3(e) {
    let value = e.target.value;
    if (value.startsWith('0x')) {
      value = value.substring(2);
    }
    const numValue = parseInt(value, 16);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
      this.a3 = numValue;
      // Hardware emulation: Store X3 value to memory address A3 when value changes
      this.memory[this.a3] = this.x3;
    }
  }

  changeX0(e) {
    let value = e.target.value;
    // Handle hex input (0x format)
    if (value.startsWith('0x')) {
      const hexValue = value.substring(2);
      const numValue = parseInt(hexValue, 16);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
        this.x0 = numValue;
      }
    }
    // Handle ASCII character input
    else if (value.length === 1) {
      const charCode = value.charCodeAt(0);
      if (charCode >= 0 && charCode <= 255) {
        this.x0 = charCode;
      }
    } else if (value.length === 0) {
      // Empty input means space (ASCII 32)
      this.x0 = 32;
    }
  }

  changeX1(e) {
    let value = e.target.value;
    // Handle hex input (0x format)
    if (value.startsWith('0x')) {
      const hexValue = value.substring(2);
      const numValue = parseInt(hexValue, 16);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
        this.x1 = numValue;
      }
    }
    // Handle ASCII character input
    else if (value.length === 1) {
      const charCode = value.charCodeAt(0);
      if (charCode >= 0 && charCode <= 255) {
        this.x1 = charCode;
      }
    } else if (value.length === 0) {
      // Empty input means space (ASCII 32)
      this.x1 = 32;
    }
  }

  changeX2(e) {
    let value = e.target.value;
    // Handle hex input (0x format)
    if (value.startsWith('0x')) {
      const hexValue = value.substring(2);
      const numValue = parseInt(hexValue, 16);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
        this.x2 = numValue;
      }
    }
    // Handle ASCII character input
    else if (value.length === 1) {
      const charCode = value.charCodeAt(0);
      if (charCode >= 0 && charCode <= 255) {
        this.x2 = charCode;
      }
    } else if (value.length === 0) {
      // Empty input means space (ASCII 32)
      this.x2 = 32;
    }
  }

  changeX3(e) {
    let value = e.target.value;
    // Handle hex input (0x format)
    if (value.startsWith('0x')) {
      const hexValue = value.substring(2);
      const numValue = parseInt(hexValue, 16);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
        this.x3 = numValue;
      }
    }
    // Handle ASCII character input
    else if (value.length === 1) {
      const charCode = value.charCodeAt(0);
      if (charCode >= 0 && charCode <= 255) {
        this.x3 = charCode;
      }
    } else if (value.length === 0) {
      // Empty input means space (ASCII 32)
      this.x3 = 32;
    }
  }

  handleResize() {
    this.isMobile = window.innerWidth <= 1000;
  }

  blurX0(e) {
    e.target.value = `0x${this.toHex(this.x0)}`;
  }

  blurX1(e) {
    e.target.value = `0x${this.toHex(this.x1)}`;
  }

  blurX2(e) {
    e.target.value = `0x${this.toHex(this.x2)}`;
  }

  blurX3(e) {
    e.target.value = `0x${this.toHex(this.x3)}`;
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
    // Disassemble a single instruction byte
    if (instruction === 0x00) return "HALT";
    
    // 8-bit patterns
    if ((instruction >> 3) === 0x08) { // 01000xxx - ZERO
      const reg = instruction & 0x07;
      return `ZERO ${this.getRegisterName(reg)}`;
    }
    if ((instruction >> 3) === 0x09) { // 01001xxx - CMPZ
      const reg = instruction & 0x07;
      return `CMPZ ${this.getRegisterName(reg)}`;
    }
    if ((instruction >> 3) === 0x0A) { // 01010xxx - INC
      const reg = instruction & 0x07;
      return `INC ${this.getRegisterName(reg)}`;
    }
    if ((instruction >> 3) === 0x0B) { // 01011xxx - DEC
      const reg = instruction & 0x07;
      return `DEC ${this.getRegisterName(reg)}`;
    }
    
    // 5-bit patterns for immediate instructions
    if ((instruction >> 5) === 0x04) { // 100xxxxx - Immediate instructions
      const subOpcode = (instruction >> 3) & 0x03;
      const reg = instruction & 0x07;
      const instructions = ["SET", "CMP", "ADD", "SUB"];
      return `${instructions[subOpcode]} ${this.getRegisterName(reg)}, [immediate]`;
    }
    
    // Jump instructions
    if ((instruction >> 5) === 0x05) { // 10100xxx - Jump instructions
      const jumpType = instruction & 0x03;
      const jumpTypes = ["JE", "JL", "JG", "JP"];
      return `${jumpTypes[jumpType]}, [address]`;
    }
    
    // Register copy instructions
    if ((instruction >> 6) === 0x03) { // 11xxxxxx - MOV
      const destReg = (instruction >> 3) & 0x07;
      const srcReg = instruction & 0x07;
      return `MOV ${this.getRegisterName(destReg)}, ${this.getRegisterName(srcReg)}`;
    }
    
    return "Invalid instruction";
  }

  getRegisterName(regNum) {
    const registers = ['A0', 'A1', 'A2', 'A3', 'X0', 'X1', 'X2', 'X3'];
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
              
              <!-- Register Section -->
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
                          <small class="text-muted">CMP:</small><br>
                          <select class="form-control form-control-sm font-monospace" @change=${this.changeComparison}>
                            <option value="=" ${this.comparison === "=" ? "selected" : ""}>=</option>
                            <option value="<" ${this.comparison === "<" ? "selected" : ""}><</option>
                            <option value=">" ${this.comparison === ">" ? "selected" : ""}>></option>
                          </select>
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
                          <small class="text-muted">A0:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.a0)}" @input=${this.changeA0}>
                        </div>
                        <div>
                          <small class="text-muted">A1:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.a1)}" @input=${this.changeA1}>
                        </div>
                        <div>
                          <small class="text-muted">A2:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.a2)}" @change=${this.changeA2}>
                        </div>
                        <div>
                          <small class="text-muted">A3:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.a3)}" @change=${this.changeA3}>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style="${this.isMobile ? 'border: none; box-shadow: none; margin-bottom: 0.25rem;' : 'border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);'}">
                    <div style="padding: ${this.isMobile ? '0.25rem' : '1rem'};">
                      <div style="display: flex; gap: 0.5rem;">
                        <div>
                          <small class="text-muted">X0:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.x0)}" @input=${this.changeX0} @blur=${this.blurX0}>
                        </div>
                        <div>
                          <small class="text-muted">X1:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.x1)}" @input=${this.changeX1} @blur=${this.blurX1}>
                        </div>
                        <div>
                          <small class="text-muted">X2:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.x2)}" @input=${this.changeX2} @blur=${this.blurX2}>
                        </div>
                        <div>
                          <small class="text-muted">X3:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.x3)}" @input=${this.changeX3} @blur=${this.blurX3}>
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

customElements.define('cdc8512-cpu', CDC8512CPU);

