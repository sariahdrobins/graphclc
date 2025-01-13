// Toggle the trig functions dropdown
function toggleTrigDropdown() {
    var dropdown = document.getElementById("trigDropdown");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

// Append text to the output
function appendText(text) {
    let output = document.getElementById('output');
    if (output.innerText === '0') {
        output.innerText = text;
    } else {
        output.innerText += text;
    }
}

// Function to calculate the result based on the input
function calculate() {
    let output = document.getElementById('output');
    try {
        let result = eval(output.innerText); // Basic eval for now
        output.innerText = result;
        plotGraph(output.innerText); // Update graph with the new result
    } catch (e) {
        output.innerText = "Error";
    }
}

// Function to plot the graph using D3.js
function plotGraph(equation) {
    let xValues = Array.from({ length: 20 }, (_, i) => i - 10);
    let yValues = xValues.map(x => {
        try {
            return eval(equation.replace('x', x)); // Evaluate the equation for each x value
        } catch (e) {
            return NaN; // Return NaN if the evaluation fails
        }
    });

    let width = 500, height = 300;
    let margin = { top: 10, right: 10, bottom: 30, left: 40 };

    d3.select("#graph").html(""); // Clear previous graph

    let svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let xScale = d3.scaleLinear().domain([d3.min(xValues), d3.max(xValues)]).range([0, width - margin.left - margin.right]);
    let yScale = d3.scaleLinear().domain([d3.min(yValues), d3.max(yValues)]).range([height - margin.top - margin.bottom, 0]);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    let line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    let data = xValues.map((x, index) => ({ x: x, y: yValues[index] }));

    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);
}

// Insert exponentiation (e.g., x^y)
function insertExponent() {
    let output = document.getElementById('output');
    output.innerText += "^";
}

// Insert subscript (e.g., xₙ)
function insertSubscript() {
    let output = document.getElementById('output');
    output.innerText += "ₙ";
}

// Insert mixed fraction (e.g., 1 ½)
function insertMixedFraction() {
    let output = document.getElementById('output');
    output.innerText += "1 ½"; // Placeholder for mixed fraction functionality
}

// Insert coordinate (e.g., (x, y))
function insertCoordinate() {
    let output = document.getElementById('output');
    output.innerText += "(x, y)";
}

// Insert alphabetic characters
function insertAlphabet() {
    let output = document.getElementById('output');
    output.innerText += "abc"; // Placeholder for alphabetic input
}

// Function to delete the last character in the output
function deleteLast() {
    let output = document.getElementById('output');
    output.innerText = output.innerText.slice(0, -1);
}

// Function to move the cursor left
function moveCursor(direction) {
    let output = document.getElementById('output');
    // Extend to handle cursor movement
}

// Function to toggle table visibility
function toggleTable() {
    // Add functionality for table display
}

// Insert Piecewise function (Placeholder)
function insertPiecewise() {
    let output = document.getElementById('output');
    output.innerText += "{f(x)}"; // Placeholder for piecewise function
}

// Trigonometric functions for dropdown
function insertTrigFunction(func) {
    let output = document.getElementById('output');
    output.innerText += func;
}

// Trigonometric Functions Dropdown
function toggleTrigDropdown() {
    var dropdown = document.getElementById("trigDropdown");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

// Add trig function buttons dynamically
document.addEventListener("DOMContentLoaded", function() {
    const trigButtons = [
        'sin', 'arcsin', 'sinh', 'cos', 'arccos', 'cosh', 'tan', 'arctan', 'tanh', 
        'cot', 'arccot', 'coth', 'sec', 'arcsec', 'sech', 'csc', 'arccsc', 'csch'
    ];

    const trigDropdown = document.getElementById("trigDropdown");

    trigButtons.forEach(function(func) {
        const button = document.createElement("button");
        button.innerHTML = func;
        button.onclick = function() {
            insertTrigFunction(func);
        };
        trigDropdown.appendChild(button);
    });
});
