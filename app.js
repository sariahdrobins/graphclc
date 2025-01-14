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
    
    // If current text is just "0", replace it; otherwise, append
    if (output.innerText === "0") {
        output.innerText = text;
    } else {
        output.innerText += text;
    }
}

/*********************************************************
 * 2. CALCULATION & GRAPHING
 *********************************************************/

// Main calculation function
function calculate() {
    const output = document.getElementById('output');
    try {
        // 1. Get the expression in the output
        let expression = output.innerText;

        // 2. Convert '^' to '**' for exponentiation
        expression = expression.replace(/\^/g, '**');

        // 3. Prepend "Math." for recognized trig functions (sin, cos, tan, etc.)
        expression = expression.replace(
            /\b(sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|cot|arccot|coth|sec|arcsec|sech|csc|arccsc|csch)\(/g,
            (_, fnName) => `Math.${fnName}(`
        );

        // 4. Handle ln(...) => Math.log(...)
        expression = expression.replace(/\bln\(/g, "Math.log(");

        // 5. Handle log(...) => interpret as base-10 => Math.log10(...)
        expression = expression.replace(/\blog\(/g, "Math.log10(");

        // 6. Handle log_b(...) => prompt for base
        expression = expression.replace(/log_b\(([^)]+)\)/g, (match, innerExpr) => {
            const base = prompt("Enter the base for log_b:") || "10";
            // Convert `log_b(...)` => Math.log(innerExpr)/Math.log(base)
            return `Math.log(${innerExpr})/Math.log(${base})`;
        });

        // 7. Fix multiplication: if user typed e.g. "2x3", you can decide if you want it to be "2*3" 
        //    but typically users might click the (x) button for multiplication. 
        //    If so, let's replace any standalone ' x ' with '*'
        //    We'll do a simple approach: any ' x ' or 'x' that's not a trig function or variable usage
        //    This can be tricky, so here's a simple approach:
        //    a) If you want letter x for variable usage, skip this step. 
        //    b) If you want letter x for multiplication, do the replacement below:
        //    expression = expression.replace(/\bx\b/g, '*'); 
        //    But be careful not to break expressions that actually use x as a variable.
        //    For your case, let's assume "x" is the variable, so we skip turning "x" into "*".
        //    If you want a multiplication symbol, you might use "×" or something else.

        // Evaluate the final expression
        const result = eval(expression);

        // Display the result
        output.innerText = result;

        // If expression includes 'x', attempt to plot it. Otherwise clear the graph.
        if (expression.includes('x')) {
            plotGraph(expression);
        } else {
            d3.select("#graph").html("");
        }
    } catch (e) {
        output.innerText = "Error";
    }
}

// D3.js function to plot if expression includes 'x'
function plotGraph(expression) {
    let xValues = [];
    const step = 0.1;
    for (let i = -10; i <= 10; i += step) {
        xValues.push(i);
    }

    let yValues = xValues.map(x => {
        // Replace every 'x' with numeric value
        const localExpr = expression.replace(/x/g, `(${x})`);
        try {
            return eval(localExpr);
        } catch {
            return NaN;
        }
    });

    // D3 chart setup
    const width = 500;
    const height = 300;
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

    // Create line
    const lineGen = d3.line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y));

    const data = xValues.map((x, i) => ({ x: x, y: yValues[i] }));

    svg.append("path")
       .data([data])
       .attr("fill", "none")
       .attr("stroke", "steelblue")
       .attr("stroke-width", 2)
       .attr("d", lineGen);
}

/*********************************************************
 * 3. ADDITIONAL CALCULATOR FEATURES
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

// Quick fraction insertion (e.g., "1/2")
function insertFraction() {
    const output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "1/2";
    } else {
        output.innerText += "1/2";
    }
}

// Insert coordinate placeholder (x,y)
function insertCoordinate() {
    const output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "(x,y)";
    } else {
        output.innerText += "(x,y)";
    }
}

// Insert simple alphabetic placeholder
function insertAlphabet() {
    const output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "abc";
    } else {
        output.innerText += "abc";
    }
}

// Insert piecewise placeholder
function insertPiecewise() {
    const output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "{f(x)}";
    } else {
        output.innerText += "{f(x)}";
    }
}

// Clear the output completely
function clearOutput() {
    document.getElementById('output').innerText = "0";
}

// Move cursor left or right (placeholder)
function moveCursor(direction) {
    // Left for advanced text editing
}

// Table toggling (placeholder)
function toggleTable() {
    // Future logic
}

// Submitting input (placeholder)
function submitInput() {
    const output = document.getElementById('output');
    console.log("Submitted: " + output.innerText);
}
function calculate() {
    let output = document.getElementById('output');
    try {
        let expression = output.innerText;
        
        // Example: Convert '^' to '**' for exponents
        expression = expression.replace(/\^/g, '**');
        
        // Square Root: √(...) => Math.sqrt(...)
        // (Important to escape the √ symbol in the regex)
        expression = expression.replace(/√\(/g, 'Math.sqrt(');

        // ... handle trig, logs, etc. ...
        
        // Evaluate the final expression
        let result = eval(expression); 
        output.innerText = result;
        
        // If you do graphing, call your plotGraph function if needed
        // e.g., if (expression.includes('x')) { plotGraph(expression); }
    } catch (err) {
        output.innerText = "Error";
    }
}


/*********************************************************
 * 4. TRIG FUNCTIONS DROPDOWN
 *********************************************************/

// Toggles the trig dropdown
function toggleTrigDropdown() {
    const dropdown = document.getElementById("trigDropdown");
    dropdown.style.display = (dropdown.style.display === "none") ? "block" : "none";
}
