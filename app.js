// Wait for the DOM to load before executing JavaScript
window.onload = function() {
    const mathInput = document.getElementById('math-input');
    
    // Function to insert button text into the math input field
    function insertSymbol(symbol) {
        mathInput.innerHTML += symbol;
    }

    // Define the buttons for the Math Keyboard
    const buttons = [
        '7', '8', '9', '/', 'sin', 'cos', 'tan',
        '4', '5', '6', '*', '(', ')', '^',
        '1', '2', '3', '-', 'sqrt', 'x²', 'log',
        '0', '.', '=', '+'
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

