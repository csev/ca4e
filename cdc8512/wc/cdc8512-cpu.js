import {html, css, LitElement} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.4.0/core/lit-core.min.js';
import { msg } from 'https://cdn.jsdelivr.net/npm/@lit/localize@0.12.2/lit-localize.min.js';

// https://stackoverflow.com/questions/68614776/using-lit-with-javascript-and-no-build-tools

export class CDC8512CPU extends LitElement {

  static get properties() {
    return {
      running: { type: Boolean }  
    }
  }

  constructor() {
    super();
    this.running = false; 
  }

  clickMe() {
    this.running = !this.running; 
  }

  createRenderRoot() { return this;}

  render() {
    return html`
        <i class="fas fa-cog ${this.running ? "fa-spin" : "" }"></i>
        <button class="btn btn-primary"
            @click=${this.clickMe}>
          ${this.running ? msg("Stop") : msg("Start")}
        </button>
    `;
  }
}

customElements.define('cdc8512-cpu', CDC8512CPU);

