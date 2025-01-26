import {html, css, LitElement} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.4.0/core/lit-core.min.js';
import { msg } from 'https://cdn.jsdelivr.net/npm/@lit/localize@0.12.2/lit-localize.min.js';
import { repeat } from 'https://unpkg.com/lit-html@2.7.4/directives/repeat.js';

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

  createRenderRoot() { return this;}

  render() {
    return html`
        <i class="fas fa-cog ${this.running ? "fa-spin" : "" }"></i>
        <button class="btn btn-primary"
            @click=${this.toggleRunning}>
          ${this.running ? msg("Stop") : msg("Start")}
        </button>
        <b>Memory</b>
        <ul>
          ${repeat(
            this.memory,
            (word, index) => html`
            <li>${index}: <input type="text" value="${word}" @input=${this.changeMemory(index)}></li>
            `
          )}
        </ul>
        <b>Instructions</b>
        <ul>
          ${repeat(
            this.instructions,
            (word, index) => html`
            <li>${index}: <input type="text" value="${word}" @input=${this.changeInstruction(index)}></li>
            `
          )}
        </ul>
    `;
  }
}

customElements.define('cdc8512-cpu', CDC8512CPU);

