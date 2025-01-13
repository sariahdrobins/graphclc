/*********************************************************
 * 1. CORE HELPER FUNCTIONS
 *********************************************************/

// Clears the entire output
function clearOutput() {
    document.getElementById('output').innerText = "0";
}

// Appends text (numbers, symbols, or partial expressions) to the output
function appendText(text) {
    let output = document.getElementById('output');

    // If current text is just "0", we replace it
    if (output.innerText === "0") {
        // If it's a trig function with parentheses, just replace
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
    let output = document.getElementById('output');
    try {
        // 1. Retrieve the user expression
        let expression = output.innerText;

        // 2. Replace '^' with '**' for exponentiation
        expression = expression.replace(/\^/g, '**');

        // 3. Prepend "Math." to recognized trig functions
        //    e.g., sin(...) => Math.sin(...), tan(...) => Math.tan(...), etc.
        expression = expression.replace(
            /\b(sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|cot|arccot|coth|sec|arcsec|sech|csc|arccsc|csch)\(/g,
            (match, fnName) => "Math." + fnName + "("
        );

        // 4. Handle ln(...) => Math.log(...)
        expression = expression.replace(/\bln\(/g, "Math.log(");

        // 5. Handle log(...) => interpret as base-10 => Math.log10(...)
        expression = expression.replace(/\blog\(/g, "Math.log10(");

        // 6. Handle log_b(...) => prompt user for base
        expression = expression.replace(/log_b\(([^)]+)\)/g, function(match, innerExpr) {
            let base = prompt("Enter the base for log_b:");
            if (!base) base = 10; 
            return `Math.log(${innerExpr})/Math.log(${base})`; 
        });

        // 7. Evaluate the expression
        let result = eval(expression);

        // 8. Update the output
        output.innerText = result;

        // 9. Plot the expression if it contains x, otherwise clear the graph
        if (expression.includes("x")) {
            plotGraph(expression);
        } else {
            d3.select("#graph").html("");
        }
    } catch (e) {
        output.innerText = "Error";
    }
}

// D3.js function to plot the expression if it contains 'x'
function plotGraph(expression) {
    // Evaluate from x = -10 to x = 10 in steps of 0.1
    let xValues = [];
    let step = 0.1;
    for (let i = -10; i <= 10; i += step) {
        xValues.push(i);
    }

    let yValues = xValues.map(x => {
        // Replace x with numeric value in expression
        let localExpr = expression.replace(/x/g, `(${x})`);
        try {
            return eval(localExpr);
        } catch (e) {
            return NaN;
        }
    });

    // D3 chart setup
    let width = 500,
        height = 300;
    let margin = { top: 10, right: 10, bottom: 30, left: 40 };

    d3.select("#graph").html(""); // Clear previous graph

    let svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let minX = d3.min(xValues),
        maxX = d3.max(xValues);
    let minY = d3.min(yValues),
        maxY = d3.max(yValues);

    let xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, width - margin.left - margin.right]);

    let yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([height - margin.top - margin.bottom, 0]);

    // X-Axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    // Y-Axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Create line
    let lineGen = d3.line()
        .x((d, i) => xScale(d.x))
        .y((d, i) => yScale(d.y));

    let data = xValues.map((x, i) => ({ x: x, y: yValues[i] }));

    svg.append("path")
        .data([data])
        .attr("d", lineGen)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);
}

/*********************************************************
 * 3. ADDITIONAL CALCULATOR FEATURES
 *********************************************************/

// Insert exponent symbol '^' (calc logic will handle '^' => '**')
function insertExponent() {
    let output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "^";
    } else {
        output.innerText += "^";
    }
}

// Insert subscript symbol (xₙ)
function insertSubscript() {
    let output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "ₙ";
    } else {
        output.innerText += "ₙ";
    }
}

// Insert fraction (quick approach: "1/2")
function insertFraction() {
    let output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "1/2";
    } else {
        output.innerText += "1/2";
    }
}

// Insert coordinate (e.g., (x,y))
function insertCoordinate() {
    let output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "(x,y)";
    } else {
        output.innerText += "(x,y)";
    }
}

// Insert alphabetic characters
function insertAlphabet() {
    let output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "abc";
    } else {
        output.innerText += "abc";
    }
}

// Insert piecewise (placeholder)
function insertPiecewise() {
    let output = document.getElementById('output');
    if (output.innerText === "0") {
        output.innerText = "{f(x)}";
    } else {
        output.innerText += "{f(x)}";
    }
}

// Clear the entire output
function clearOutput() {
    document.getElementById('output').innerText = "0";
}

// Move the cursor left or right (placeholder)
function moveCursor(direction) {
    // If you want advanced cursor movement, you'd need a more robust approach
}

// Toggling the table (placeholder)
function toggleTable() {
    // Future logic for showing/hiding a table
}

// Submitting input (placeholder)
function submitInput() {
    let output = document.getElementById('output');
    console.log("Submitted: " + output.innerText);
}

/*********************************************************
 * 4. TRIG FUNCTIONS DROPDOWN
 *********************************************************/

// Toggle the trig functions dropdown
function toggleTrigDropdown() {
    var dropdown = document.getElementById("trigDropdown");
    dropdown.style.display = (dropdown.style.display === "none") ? "block" : "none";
}
