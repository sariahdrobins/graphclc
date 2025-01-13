// Function to append text to the output (handles trigonometric functions properly)
function appendText(text) {
    let output = document.getElementById('output');
    if (output.innerText === '0') {
        output.innerText = text;
    } else {
        // Ensure that trigonometric functions like sin, cos, etc., append with parentheses
        if (["sin", "cos", "tan", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "cot", "arccot", "sec", "arcsec", "csc", "arccsc"].includes(text)) {
            output.innerText += text + "("; // Add parentheses for trig functions
        } else {
            output.innerText += text;
        }
    }
}

// Function to toggle the trig functions dropdown
function toggleTrigDropdown() {
    var dropdown = document.getElementById("trigDropdown");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

// Function to calculate the result based on the input
function calculate() {
    let output = document.getElementById('output');
    try {
        // Ensure that all mathematical functions (like sin, cos, etc.) are properly recognized
        let equation = output.innerText.replace(/sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|cot|arccot|sec|arcsec|csc|arccsc/g, function(match) {
            return "Math." + match; // Prepend Math. to trig functions so they are recognized by JavaScript
        });

        // Evaluate the equation using eval (you might want to replace eval with a safer parser for production)
        let result = eval(equation);
        output.innerText = result;

        // Optionally, plot the result on the graph
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

// Function to display the fraction input form
function insertFraction() {
    let output = document.getElementById('output');
    
    // Create fraction form if not already created
    if (!document.getElementById('fractionForm')) {
        let fractionForm = document.createElement('div');
        fractionForm.id = 'fractionForm';
        
        // Numerator input field
        let numeratorInput = document.createElement('input');
        numeratorInput.type = 'text';
        numeratorInput.id = 'numerator';
        numeratorInput.placeholder = 'Numerator';
        
        // Denominator input field
        let denominatorInput = document.createElement('input');
        denominatorInput.type = 'text';
        denominatorInput.id = 'denominator';
        denominatorInput.placeholder = 'Denominator';
        
        // Submit button to insert the fraction
        let submitButton = document.createElement('button');
        submitButton.innerText = 'Submit Fraction';
        submitButton.onclick = function() {
            let numerator = document.getElementById('numerator').value;
            let denominator = document.getElementById('denominator').value;
            if (numerator && denominator) {
                output.innerText += `${numerator}/${denominator}`; // Insert fraction into the output
                document.getElementById('fractionForm').remove(); // Remove the form after submitting
            }
        };

        // Append the form to the calculator
        fractionForm.appendChild(numeratorInput);
        fractionForm.appendChild(denominatorInput);
        fractionForm.appendChild(submitButton);
        document.body.appendChild(fractionForm);
    }
}

// Insert exponentiation (e.g., x^y)
function insertExponent() {
    let output = document.getElementById('output');
    output.innerText += "^";
}
// Function to calculate the result based on the input
function calculate() {
    let output = document.getElementById('output');
    try {
        let expression = output.innerText;

        // Replace ^ with ** for proper exponentiation handling in JavaScript
        expression = expression.replace(/\^/g, '**'); // Replace all '^' with '**'

        let result = eval(expression); // Basic eval for now, but it will handle exponentiation properly
        output.innerText = result;
        plotGraph(result); // Update graph with the new result (optional)
    } catch (e) {
        output.innerText = "Error";
    }
}

// Insert subscript (e.g., xₙ)
function insertSubscript() {
    let output = document.getElementById('output');
    output.innerText += "ₙ";
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


// Function to clear the entire output
function clearOutput() {
    let output = document.getElementById('output');
    output.innerText = ''; // Clear the output

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
