function add(a, b) {

  return a + b;

}



function subtract(a, b) {

  return a - b;

}

function setdiv(div, text) {
    console.log("setdiv", div, text);
    document.getElementById(div).innerText = text;
}


export { add, subtract, setdiv }; 

