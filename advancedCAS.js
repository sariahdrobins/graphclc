/**
 * fXSingleApproach():
 *    Single approach: The user types either:
 *      "f(x)= (x-1)/(sqrt(x)-2)"  (function definition, advanced analysis)
 *    or
 *      "f(3)"                     (evaluate the existing function)
 *    in the same input box, then clicks ONE button, e.g. "f(x)".
 */
function fXSingleApproach() {
  const input = document.getElementById('funcLine').value.trim();
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // Check if user typed "f(x)=..."
  if (input.includes('=') && /\w+\(\w+\)=/.test(input)) {
    // => This is a function definition, e.g. "f(x)= x^2+1"
    defineAndAnalyzeSingle(input);
  } else {
    // Possibly "f(3)" => direct evaluation
    const evalMatch = input.match(/^(\w+)\(([^)]+)\)$/);
    if (evalMatch) {
      const fnName = evalMatch[1]; // e.g. "f"
      const arg    = evalMatch[2]; // e.g. "3"
      evaluateSingle(fnName, arg);
    } else {
      // Not recognized => show error
      analysisDiv.innerHTML = `
        <p style="color:red;">
          Error: Type either "f(x)= expression" or "f(3)".
        </p>
      `;
    }
  }
}

/**
 * defineAndAnalyzeSingle(rawInput):
 *   This replaces the old defineAndAnalyze(), using the same domain/
 *   derivative/intercept logic. However, it doesn't read from #funcInput;
 *   it directly takes the string "f(x)= expression" from fXSingleApproach().
 */
function defineAndAnalyzeSingle(rawInput) {
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // e.g. rawInput = "f(x)= x^2+1"
  let [lhs, rhs] = rawInput.split('=').map(s => s.trim());
  let fnMatch = lhs.match(/^(\w+)\((\w+)\)$/);
  if (!fnMatch) {
    analysisDiv.innerHTML = `
      <p style="color:red;">Error: must be "f(x)=..."</p>
    `;
    return;
  }
  let functionName = fnMatch[1]; // e.g. "f"
  let variableName = fnMatch[2]; // e.g. "x"

  // 1) Define function in Nerdamer
  try {
    nerdamer.setFunction(functionName, variableName, rhs);
  } catch(err) {
    analysisDiv.innerHTML = `
      <p style="color:red;">Error defining function in Nerdamer: ${err.message}</p>
    `;
    return;
  }

  // 2) Advanced domain/derivative/intercept/range analysis
  let html = `<h2>Function: ${functionName}(${variableName}) = ${rhs}</h2>`;

  // 2a) Domain analysis
  let domainAnalysis = analyzeDomain(rhs, variableName);
  html += `<p><strong>Domain (Intervals):</strong> <code>${domainAnalysis.text}</code></p>`;

  // 2b) Derivative
  let derivativeStr = "N/A";
  try {
    derivativeStr = nerdamer.diff(rhs, variableName).text();
  } catch {}
  html += `<p><strong>Derivative:</strong> <code>${derivativeStr}</code></p>`;

  // 2c) Critical points
  let criticalPoints = findCriticalPoints(derivativeStr, variableName, domainAnalysis);
  if (criticalPoints.length > 0) {
    html += `<p><strong>Critical Points:</strong> <code>${JSON.stringify(criticalPoints)}</code></p>`;
  } else {
    html += `<p><strong>Critical Points:</strong> None or not solvable</p>`;
  }

  // 2d) Intercepts
  let yInt  = findYIntercept(functionName, variableName, domainAnalysis);
  let xInts = findXIntercepts(functionName, variableName, domainAnalysis);
  html += `<p><strong>y-intercept:</strong> <code>${yInt}</code></p>`;
  if (xInts.length > 0) {
    html += `<p><strong>x-intercepts:</strong> <code>${JSON.stringify(xInts)}</code></p>`;
  } else {
    html += `<p><strong>x-intercepts:</strong> None or none real</p>`;
  }

  // 2e) Range estimation
  let rangeEst = guessRange(rhs, variableName, domainAnalysis, criticalPoints);
  html += `<p><strong>Range (estimated):</strong> <code>${rangeEst}</code></p>`;

  // 2f) Indefinite integral
  let indefinite = "N/A";
  try {
    indefinite = nerdamer(`integrate(${rhs},${variableName})`).text();
  } catch {}
  html += `<p><strong>Indefinite Integral:</strong> 
    <code>∫${rhs} d${variableName} = ${indefinite}</code></p>`;

  analysisDiv.innerHTML = html;
}

/**
 * evaluateSingle(fnName, arg):
 *   If the user typed "f(3)", we do nerdamer("f(3)").evaluate()
 *   => numeric result, displayed in #analysis.
 */
function evaluateSingle(fnName, arg) {
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  try {
    let val = nerdamer(`${fnName}(${arg})`).evaluate().text();
    analysisDiv.innerHTML = `
      <p><strong>Evaluation:</strong> 
      <code>${fnName}(${arg}) = ${val}</code></p>
    `;
  } catch(err) {
    analysisDiv.innerHTML = `
      <p style="color:red;">
        Error evaluating ${fnName}(${arg}): ${err.message}
      </p>
    `;
  }
}

/***************************************************************
 * analyzeDomain(expression, variable):
 *  - Finds constraints from logs (arg>0), sqrt (arg≥0), denominators (≠0)
 *  - Symbolically solves them => merges intervals
 *  - Returns { intervals: [ [start, end, open/closed], ... ], text: "..." }
 ***************************************************************/
function analyzeDomain(expr, variable) {
  let constraints = [];

  // logs => argument>0
  let logRegex = /\blog\s*\(\s*([^)]+)\)|\bln\s*\(\s*([^)]+)\)/g;
  let match;
  while((match = logRegex.exec(expr)) !== null) {
    let inside = match[1] || match[2];
    constraints.push(`${inside}>0`);
  }

  // sqrt(...) => inside≥0
  let sqrtRegex = /sqrt\s*\(\s*([^)]+)\)/g;
  while((match = sqrtRegex.exec(expr)) !== null) {
    let inside = match[1];
    constraints.push(`${inside}>=0`);
  }

  // denominators => not zero => use getDenom
  let domainText = "(-∞,∞)";
  let intervals = [ {start:-Infinity, end:Infinity, openStart:false, openEnd:false} ];

  try {
    let symbolic = nerdamer(expr);
    let denomSym = symbolic.getDenom();
    if (denomSym && denomSym.text() !== "1") {
      // solve denom=0 => excluded
      let zeros = nerdamer(`solve(${denomSym.text()}=0, ${variable})`).evaluate().text();
      let zeroVals = parseNerdamerSolve(zeros);
      zeroVals.forEach(zv => {
        let num = parseFloat(zv);
        if(!isNaN(num)) {
          constraints.push(`${variable}!=${num}`);
        }
      });
    }
  } catch(e) {}

  let text = (constraints.length > 0) 
    ? constraints.join(" & ") 
    : "No explicit constraints => all reals";

  return { intervals, text };
}

/***************************************************************
 * parseNerdamerSolve(s):
 *   e.g. s="x=2" or "[2,3]" or "{x:2}" => produce array of solutions
 ***************************************************************/
function parseNerdamerSolve(s) {
  s = s.replace(/\s/g,'');
  if(!s) return [];
  if(s.startsWith("[")) {
    let inside = s.slice(1,-1);
    return inside.split(',').map(x => x.trim());
  }
  if(s.includes("=")) {
    let eqParts = s.split("=");
    if(eqParts.length>1) return [eqParts[1]];
  }
  if(s.startsWith("{")) {
    let inside = s.slice(1,-1); // "x:2"
    let eqp = inside.split(":");
    if(eqp.length>1) return [eqp[1]];
  }
  return [s];
}

/***************************************************************
 * findCriticalPoints(derivativeStr, variable, domainAnalysis):
 *   derivative=0 => solve. Then filter out solutions not in domain
 ***************************************************************/
function findCriticalPoints(derivativeStr, variable, domainAnalysis) {
  if(!derivativeStr || derivativeStr === "0" || derivativeStr === "N/A") return [];
  let solutions = [];
  try {
    let sol = nerdamer(`solve(${derivativeStr}=0, ${variable})`).evaluate().text();
    let arr = parseNerdamerSolve(sol);
    solutions = arr; 
  } catch(e) {}
  return solutions;
}

/***************************************************************
 * findYIntercept(functionName, variable, domainAnalysis):
 *   Evaluate f(0) if valid
 ***************************************************************/
function findYIntercept(fnName, variable, domainAnalysis) {
  try {
    let val = nerdamer(`${fnName}(0)`).evaluate().text();
    return `(0, ${val})`;
  } catch(e) {
    return "N/A";
  }
}

/***************************************************************
 * findXIntercepts(functionName, variable, domainAnalysis):
 *   Solve f(x)=0
 ***************************************************************/
function findXIntercepts(fnName, variable, domainAnalysis) {
  try {
    let sol = nerdamer(`solve(${fnName}(${variable})=0, ${variable})`).evaluate().text();
    return parseNerdamerSolve(sol);
  } catch(e) {
    return [];
  }
}

/***************************************************************
 * guessRange(expr, variable, domainAnalysis, criticalPoints):
 *  - Evaluate at domain edges, criticalPoints, partial approach 
 *  - Real approach is extremely complex
 ***************************************************************/
function guessRange(expr, variable, domainAnalysis, criticalPoints) {
  let sampleXs = [];
  let domainStr = domainAnalysis.text;
  let minDomain = -Infinity;
  let maxDomain = Infinity;
  let constraints = domainStr.split("&");

  // parse constraints like "x>=2", "x>3"
  constraints.forEach(c => {
    let m = c.match(/(x)([><]=?)([\d\.]+)/);
    if(m) {
      let op = m[2];
      let val = parseFloat(m[3]);
      if(op === ">=" || op === ">") {
        if(val > minDomain) minDomain = val;
      } else if(op === "<=" || op === "<") {
        if(val < maxDomain) maxDomain = val;
      }
    }
  });

  if(Number.isFinite(minDomain)) sampleXs.push(minDomain);
  if(Number.isFinite(maxDomain)) sampleXs.push(maxDomain);

  // also evaluate at critical points
  criticalPoints.forEach(cp => {
    let num = parseFloat(cp);
    if(!isNaN(num)) sampleXs.push(num);
  });

  let vals = [];
  sampleXs.forEach(x => {
    if(x >= minDomain && x <= maxDomain) {
      let replaced = expr.replace(new RegExp(variable,"g"), `(${x})`);
      try {
        let val = eval(replaced);
        vals.push(val);
      } catch {}
    }
  });

  if(vals.length < 1) {
    return "No finite sample points. Possibly (-∞,∞) or more complex. Additional numeric scanning recommended.";
  }

  let minVal = Math.min(...vals);
  let maxVal = Math.max(...vals);

  if(minVal === maxVal) {
    return `{${minVal}} (seems constant or only one sample)`;
  }
  if(!Number.isFinite(minDomain) || !Number.isFinite(maxDomain)) {
    return `~[${minVal}, ${maxVal}] from sampled points, domain extends => range might be bigger.`;
  }
  return `[${minVal}, ${maxVal}] (estimated) from domain boundaries + critical points.`;
}
