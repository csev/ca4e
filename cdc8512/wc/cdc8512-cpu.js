import {html, css, LitElement} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';
import { msg } from 'https://cdn.jsdelivr.net/npm/@lit/localize@0.12.2/lit-localize.min.js';
import { repeat } from 'https://cdn.jsdelivr.net/npm/lit-html@2.7.4/directives/repeat.js';

// https://stackoverflow.com/questions/68614776/using-lit-with-javascript-and-no-build-tools

export class CDC8512CPU extends LitElement {

  static get properties() {
    return {
      running: { type: Boolean },
      memory: { type: Array },
      instructions: { type: Array }  
    }
  }

  constructor() {
    super();
    this.running = false;
    this.memory = [];
    this.instructions = [];
    for (let i = 0; i < 256; i++) {
      this.memory.push(0);
    }
    for (let i = 0; i < 256; i++) {
      this.instructions.push(0);
    }
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
      console.log("changeMemory", index, e.target.value);
      this.memory[index] = e.target.value;
    }
  }

  toHex(value) {
    return ('0000' + value.toString(16).toUpperCase()).slice(-2);
  }

  toBinary(value) {
    return ('00000000' + value.toString(2).toUpperCase()).slice(-8);
  }

  createRenderRoot() { return this;}

  render() {
    return html`
        <i class="fas fa-cog ${this.running ? "fa-spin" : "" }"></i>
        <button class="btn btn-primary"
            @click=${this.toggleRunning}>
          ${this.running ? msg("Stop") : msg("Start")}
        </button>
          <div class="container">

              <div class="row">
            <div class="col">
        <p>Instructions</p>
        <ul style="list-style-type: none; font-family: monospace;">
          ${repeat(
            this.instructions,
            (word, index) => (index>=0 && index<=15) ? html`
            <li>0x${this.toHex(index)}: <input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)}></li>
            ` : html``
          )}
        </ul>
        </div>
        <div class="col">
        <p>Instructions</p>
        <ul style="list-style-type: none; font-family: monospace;">
          ${repeat(
            this.instructions,
            (word, index) => (index>=16 && index<=31) ? html`
            <li>0x${this.toHex(index)}: <input type="text" size="8" value="${this.toBinary(word)}" @input=${this.changeInstruction(index)}></li>
            ` : html``
          )}
        </ul>
        </div>
        <div class="col">
        <p>Memory</p>
        <ul style="list-style-type: none; font-family: monospace;">
          ${repeat(
            this.memory,
            (word, index) => (index>=0 && index<=15) ? html`
            <li>0x${this.toHex(index)}: <input type="text" size="3" value="${this.toHex(word)}" @input=${this.changeMemory(index)}></li>
            ` : html``
          )}
        </ul>
        </div>
        <div class="col">
        <p>Memory</p>
        <ul style="list-style-type: none; font-family: monospace;">
          ${repeat(
            this.memory,
            (word, index) => (index>=16 && index<=31) ? html`
            <li>0x${this.toHex(index)}: <input type="text" size="3" value="${this.toHex(word)}" @input=${this.changeMemory(index)}></li>
            ` : html``
          )}
        </ul>
        </div>
      </div>
    </div>
    `;
  }
}

customElements.define('cdc8512-cpu', CDC8512CPU);

