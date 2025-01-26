import {html, css, LitElement} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.4.0/core/lit-core.min.js';

// https://stackoverflow.com/questions/68614776/using-lit-with-javascript-and-no-build-tools

export class CDC8512CPU extends LitElement {
  static get styles() {
    return css`p { color: blue }`;
  }

  static get properties() {
    return {
      name: {type: String}
    }
  }

  constructor() {
    super();
    this.name = 'Somebody';
  }

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}

customElements.define('cdc8512-cpu', CDC8512CPU);

