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
      a0: { type: Number },
      a1: { type: Number },
      a2: { type: Number },
      a3: { type: Number },
      x0: { type: Number },
      x1: { type: Number },
      x2: { type: Number },
      x3: { type: Number },
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
    this.a0 = 0;
    this.a1 = 0;
    this.a2 = 0;
    this.a3 = 0;
    this.x0 = 0;
    this.x1 = 0;
    this.x2 = 0;
    this.x3 = 0;
    
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

  toggleRunning() {
    this.running = !this.running; 
  }

  changeInstruction(index) {
    return (e) => {
      console.log("changeInstruction", index, e.target.value);
      this.instructions[index] = e.target.value;
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

  createRenderRoot() { return this;}

  static get styles() {
    return css`
      :host {
        --breakpoint-width: 1000px;
      }
      
      .register-input {
        min-width: 4ch !important;
        width: 4ch !important;
      }
      
      .registers-container {
        display: flex;
        flex-direction: row;
        gap: 1rem;
      }
      
      .instructions-memory-container {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        border: 2px solid red;
        min-height: 200px;
      }
      
      .instructions-column {
        flex: 1;
        border: 1px solid blue;
        background-color: #f0f0f0;
      }
      
      .memory-column {
        flex: 1;
        border: 1px solid green;
        background-color: #f0f0f0;
      }
      
      .instructions-list, .memory-list {
        max-height: none;
        overflow: visible;
      }
      
      .desktop-only {
        display: block;
      }
      
      @media (max-width: 1000px) {
        .registers-container {
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .desktop-only {
          display: none;
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
        <i class="fas fa-cog ${this.running ? "fa-spin" : "" }"></i>
        <button class="btn btn-primary"
            @click=${this.toggleRunning}>
          ${this.running ? msg("Stop") : msg("Start")}
        </button>
          <div class="container">
              
              <!-- Register Section -->
              <div class="mb-3">
                <h5>Registers</h5>
                <div class="registers-container">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">Control Registers</h6>
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
                      </div>
                    </div>
                  </div>
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">A Registers</h6>
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
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.a2)}" @input=${this.changeA2}>
                        </div>
                        <div>
                          <small class="text-muted">A3:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="0x${this.toHex(this.a3)}" @input=${this.changeA3}>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">X Registers</h6>
                      <div style="display: flex; gap: 0.5rem;">
                        <div>
                          <small class="text-muted">X0:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="${this.toChar(this.x0)}" @input=${this.changeX0} @blur=${this.blurX0}>
                        </div>
                        <div>
                          <small class="text-muted">X1:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="${this.toChar(this.x1)}" @input=${this.changeX1} @blur=${this.blurX1}>
                        </div>
                        <div>
                          <small class="text-muted">X2:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="${this.toChar(this.x2)}" @input=${this.changeX2} @blur=${this.blurX2}>
                        </div>
                        <div>
                          <small class="text-muted">X3:</small><br>
                          <input type="text" size="4" class="font-monospace register-input" value="${this.toChar(this.x3)}" @input=${this.changeX3} @blur=${this.blurX3}>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: row; gap: 1rem; border: 3px solid red; padding: 10px; background-color: yellow;">
                <div style="flex: 1; border: 2px solid blue; padding: 5px; background-color: lightblue;">
                  <p><strong>Instructions</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.instructions,
                      (word, index) => this.isMobile ? 
                        (index>=0 && index<=31) ? html`
                        <li><span class="${index === this.pc ? 'bg-warning' : ''}">0x${this.toHex(index)}:</span> <input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)}></li>
                        ` : html``
                        :
                        (index>=0 && index<=15) ? html`
                        <li><span class="${index === this.pc ? 'bg-warning' : ''}">0x${this.toHex(index)}:</span> <input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)}></li>
                        ` : html``
                    )}
                  </ul>
                </div>
                ${!this.isMobile ? html`
                <div style="flex: 1; border: 2px solid blue; padding: 5px; background-color: lightblue;">
                  <p><strong>Instructions 2</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.instructions,
                      (word, index) => (index>=16 && index<=31) ? html`
                      <li><span class="${index === this.pc ? 'bg-warning' : ''}">0x${this.toHex(index)}:</span> <input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)}></li>
                      ` : html``
                    )}
                  </ul>
                </div>
                ` : html``}
                <div style="flex: 1; border: 2px solid green; padding: 5px; background-color: lightgreen;">
                  <p><strong>Memory</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.memory,
                      (word, index) => this.isMobile ? 
                        (index>=0 && index<=31) ? html`
                        <li>0x${this.toHex(index)}: <input type="text" size="4" value="${this.toChar(word)}" @input=${this.changeMemory(index)} @blur=${this.blurMemory(index)}></li>
                        ` : html``
                        :
                        (index>=0 && index<=15) ? html`
                        <li>0x${this.toHex(index)}: <input type="text" size="4" value="${this.toChar(word)}" @input=${this.changeMemory(index)} @blur=${this.blurMemory(index)}></li>
                        ` : html``
                    )}
                  </ul>
                </div>
                ${!this.isMobile ? html`
                <div style="flex: 1; border: 2px solid green; padding: 5px; background-color: lightgreen;">
                  <p><strong>Memory 2</strong></p>
                  <ul style="list-style-type: none; font-family: monospace;">
                    ${repeat(
                      this.memory,
                      (word, index) => (index>=16 && index<=31) ? html`
                      <li>0x${this.toHex(index)}: <input type="text" size="4" value="${this.toChar(word)}" @input=${this.changeMemory(index)} @blur=${this.blurMemory(index)}></li>
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

