/*********************************************************
 * 1. HELPER FUNCTIONS
 *********************************************************/

// Clears the entire output
function clearOutput() {
  document.getElementById('output').innerText = "0";
}

// Inserts text into the output display
function appendText(text) {
  const output = document.getElementById('output');
  // If current text is "0", replace it; otherwise, append
  if (output.innerText === "0") {
    output.innerText = text;
  } else {
    output.innerText += text;
  }
}

/*********************************************************
 * 2. MATH.JS LOGIC (DEFINE & EVALUATE)
 *********************************************************/
const math = mathjs.create(mathjs.all);

function defineFunction() {
  const funcDef = document.getElementById('functionDef').value.trim();
  try {
    // e.g. "f(x)=x^2+1"
    math.evaluate(funcDef);
    alert(`Function defined: ${funcDef}`);
  } catch (err) {
    alert(`Error defining function: ${err.message}`);
  }
}

function evaluateExpression() {
  const expr = document.getElementById('expression').value.trim();
  try {
    const result = math.evaluate(expr);
    document.getElementById('result').innerText = result;
  } catch (err) {
    document.getElementById('result').innerText = `Error: ${err.message}`;
  }
}

/*********************************************************
 * 3. MAIN CALCULATION & GRAPHING (D3) LOGIC
 *********************************************************/

// Main calculation function for the "output" field
function calculate() {
  const output = document.getElementById('output');
  try {
    let expression = output.innerText;

    // 1) Convert '^' to '**' for exponentiation
    expression = expression.replace(/\^/g, '**');

    // 2) Replace √( with Math.sqrt(
    expression = expression.replace(/√\(/g, 'Math.sqrt(');

    // 3) Replace ∛( with Math.cbrt(
    expression = expression.replace(/∛\(/g, 'Math.cbrt(');

    // 4) Convert "≥" => ">="
    expression = expression.replace(/≥/g, '>=');

    // 5) Prepend "Math." for recognized trig functions
    expression = expression.replace(
      /\b(sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|cot|arccot|sec|arcsec|sech|csc|arccsc|csch)\(/g,
      (_, fnName) => `Math.${fnName}(`
    );

    // 6) Convert ln(...) => Math.log(...)
    expression = expression.replace(/\bln\(/g, "Math.log(");

    // 7) Convert log(...) => Math.log10(...)
    expression = expression.replace(/\blog\(/g, "Math.log10(");

    // 8) Convert log_b(...) => prompt base
    expression = expression.replace(/log_b\(([^)]+)\)/g, (match, innerExpr) => {
      const base = prompt("Enter the base for log_b:") || "10";
      return `Math.log(${innerExpr})/Math.log(${base})`;
    });

    // Evaluate
    const result = eval(expression);
    output.innerText = result;

    // If expression includes 'x', try to plot it, else clear
    if (expression.includes('x')) {
      plotGraph(expression); 
    } else {
      d3.select("#graph").html("");
    }
  } catch (err) {
    output.innerText = "Error";
  }
}

// Plot using D3.js if expression contains x
function plotGraph(expression) {
  // Evaluate from x = -10 to 10
  const xValues = [];
  const step = 0.1;
  for (let i = -10; i <= 10; i += step) {
    xValues.push(i);
  }

  // For each x, replace 'x' with the numeric value in expression
  const yValues = xValues.map(x => {
    const localExpr = expression.replace(/x/g, `(${x})`);
    try {
      return eval(localExpr);
    } catch {
      return NaN;
    }
  });

  // Basic D3 chart setup
  const width = 500,
        height = 300;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  d3.select("#graph").html(""); // Clear old graph
  
  const svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const minX = d3.min(xValues), maxX = d3.max(xValues);
  const minY = d3.min(yValues), maxY = d3.max(yValues);

  const xScale = d3.scaleLinear()
    .domain([minX, maxX])
    .range([0, width - margin.left - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([minY, maxY])
    .range([height - margin.top - margin.bottom, 0]);

  // X-axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  // Y-axis
  svg.append("g")
    .call(d3.axisLeft(yScale));

  const lineGen = d3.line()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y));

  const data = xValues.map((x, i) => ({ x, y: yValues[i] }));

  svg.append("path")
    .data([data])
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", lineGen);
}

/*********************************************************
 * 4. OTHER FEATURES (Exponent, Subscript, etc.)
 *********************************************************/

// Insert exponent symbol '^'
function insertExponent() {
  const output = document.getElementById('output');
  if (output.innerText === "0") {
    output.innerText = "^";
  } else {
    output.innerText += "^";
  }
}

// Insert subscript symbol (xₙ)
function insertSubscript() {
  const output = document.getElementById('output');
  if (output.innerText === "0") {
    output.innerText = "ₙ";
  } else {
    output.innerText += "ₙ";
  }
}

// Insert fraction
function insertFraction() {
  const output = document.getElementById('output');
  if (output.innerText === "0") {
    output.innerText = "1/2";
  } else {
    output.innerText += "1/2";
  }
}

// Insert coordinate
function insertCoordinate() {
  const output = document.getElementById('output');
  if (output.innerText === "0") {
    output.innerText = "(x,y)";
  } else {
    output.innerText += "(x,y)";
  }
}

// Insert alphabetical placeholder
function insertAlphabet() {
  const output = document.getElementById('output');
  if (output.innerText === "0") {
    output.innerText = "abc";
  } else {
    output.innerText += "abc";
  }
}

// Insert piecewise function placeholder
function insertPiecewise() {
  const output = document.getElementById('output');
  if (output.innerText === "0") {
    output.innerText = "{f(x)}";
  } else {
    output.innerText += "{f(x)}";
  }
}

// Move cursor left / right (placeholder)
function moveCursor(direction) {
  // If you want advanced cursor logic, you'd implement it here
}

// Toggle table (placeholder)
function toggleTable() {
  // Future logic for table
}

// Submitting input (placeholder)
function submitInput() {
  const output = document.getElementById('output');
  console.log("Submitted: " + output.innerText);
}

// Toggle the trig dropdown
function toggleTrigDropdown() {
  const dropdown = document.getElementById("trigDropdown");
  dropdown.style.display = (dropdown.style.display === "none") ? "block" : "none";
}
