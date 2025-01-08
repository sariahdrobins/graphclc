// Wait for the DOM to load before executing JavaScript
window.onload = function() {
    const mathInput = document.getElementById('math-input');
    
    // Function to insert button text into the math input field
    function insertSymbol(symbol) {
        mathInput.innerHTML += symbol;
    }

    // Define the buttons for the Math Keyboard
    const buttons = [
        '7', '8', '9', '/', '(', ')', 'x^y',
        '4', '5', '6', '*', '+', '-', '√',
        'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'sin⁻¹',
        'ln', 'log', 'log_b', 'e^x', 'a^x', 'π', 'e',
        'd/dx', '∫', 'lim', 'Σ',
        'Matrix+', 'Matrix-', 'Matrix×', 'dot', 'cross', 'x,y,z',
        '%', '0', '.', '='
    ];

    // Create buttons and add them to the keyboard section
    const keyboardSection = document.getElementById('math-keyboard');
    buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = button;
        buttonElement.onclick = () => insertSymbol(button);
        keyboardSection.appendChild(buttonElement);
    });
};
