function appendText(text) {
    let output = document.getElementById('output');
    if (output.innerText === '0') {
        output.innerText = text;
    } else {
        output.innerText += text;
    }
}

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

function plotGraph(equation) {
    // Initialize graph with D3.js
    const margin = {top: 20, right: 30, bottom: 40, left: 40};
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#graph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .domain([-10, 10]) // Set X range for the graph
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([-10, 10]) // Set Y range for the graph
        .range([height, 0]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add grid lines
    svg.append("g")
        .attr("class", "gridline")
        .selectAll("line")
        .data(x.ticks(20))
        .enter().append("line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#ccc");

    svg.append("g")
        .attr("class", "gridline")
        .selectAll("line")
        .data(y.ticks(20))
        .enter().append("line")
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("x1", 0)
        .attr("x2", width)
        .style("stroke", "#ccc");

    // Plot the graph
    const data = [];
    for (let i = -10; i <= 10; i += 0.1) {
        let yValue;
        try {
            yValue = eval(equation.replace('x', i)); // Evaluate the equation dynamically
        } catch (e) {
            yValue = NaN; // Catch errors in evaluation
        }
        data.push({x: i, y: yValue});
    }

    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));

    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line)
        .style("stroke", "blue")
        .style("stroke-width", 2)
        .style("fill", "none");
}

// Optional: Implement additional functionality for buttons (e.g., Fraction, Base/Subscript, etc.)
function insertFraction() {
    let output = document.getElementById('output');
    output.innerText += '\\frac{}{}'; // Add fraction format to the output
}

function insertBaseSubscript() {
    let output = document.getElementById('output');
    output.innerText += '_'; // Placeholder for subscript
}

function insertPiecewise() {
    let output = document.getElementById('output');
    output.innerText += 'piecewise'; // Placeholder for piecewise functions
}

function toggleTrigFunctions() {
    // Placeholder for toggling trigonometric functions
}

function toggleTable() {
    // Placeholder for table functionality
}

function insertMixedFraction() {
    let output = document.getElementById('output');
    output.innerText += 'mixed'; // Placeholder for mixed fraction
}

function insertCoordinate() {
    let output = document.getElementById('output');
    output.innerText += '(x, y)'; // Placeholder for coordinates
}

function insertAlphabet() {
    let output = document.getElementById('output');
    output.innerText += 'abc'; // Placeholder for alphabet input
}

function moveCursor(direction) {
    let output = document.getElementById('output');
    if (direction === 'left') {
        output.innerText = output.innerText.slice(0, -1);
    } else if (direction === 'right') {
        output.innerText += '>'; // Move cursor logic (just a placeholder)
    }
}

function deleteLast() {
    let output = document.getElementById('output');
    output.innerText = output.innerText.slice(0, -1); // Delete last character
}

function submitInput() {
    // Placeholder for submitting the input, could implement custom logic here
    let output = document.getElementById('output');
    console.log("Input submitted:", output.innerText);
}
