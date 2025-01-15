/************************************************************
 * 1) SINGLE ENTRY POINT
 *    A single approach that checks if user typed:
 *      "f(anything)= something"  => define advanced function
 *    or
 *      "f(something)"            => evaluate
 ************************************************************/
function fXSingleApproach() {
  const input = document.getElementById('funcLine').value.trim();
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // If there's an '=' sign and a pattern like f(...)=..., treat as a definition
  if (input.includes('=') && /\w+\(.+\)=/.test(input)) {
    // e.g. "f(x+7)=12" or "f(x-3)= y"
    defineAndAnalyzeSingle(input);
  } else {
    // Possibly an evaluation like "f(3)" or "f(x+7)"
    const evalMatch = input.match(/^(\w+)\(([^)]+)\)$/);
    if (evalMatch) {
      const fnName = evalMatch[1]; 
      const argStr = evalMatch[2];
      evaluateSingle(fnName, argStr);
    } else {
      // Not recognized
      analysisDiv.innerHTML = `
        <p style="color:red;">Error: Type "f(anyExpr)=..." or "f(anyExpr)"</p>
      `;
    }
  }
}

/************************************************************
 * 2) DEFINE + ANALYZE A FUNCTION 
 *    e.g. "f(x+7)=12" or "f(x)= x^2+1"
 *    We'll parse the left side "f(x+7)" => functionName="f", argumentExpr="x+7"
 *    Then define a dummy variable "u" in nerdamer.setFunction("f","u", rightSide)
 ************************************************************/
function defineAndAnalyzeSingle(rawInput) {
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // Example rawInput: "f(x+7)=12"
  let [lhs, rhs] = rawInput.split('=').map(s => s.trim()); 
  // lhs might be "f(x+7)"

  // parse out functionName and argumentExpr
  let fnMatch = lhs.match(/^(\w+)\((.+)\)$/);
  if (!fnMatch) {
    analysisDiv.innerHTML = `<p style="color:red;">
      Error: must be f(anything)=something
    </p>`;
    return;
  }
  let functionName   = fnMatch[1]; // "f"
  let argumentExpr   = fnMatch[2]; // "x+7" or "x-3"

  // We'll define a dummy variable for nerdamer, e.g. "u"
  // Then store a mapping so we know "u ↔ x+7" (if needed).
  const dummyVar = "u";

  try {
    // e.g. nerdamer.setFunction("f","u","12");
    nerdamer.setFunction(functionName, dummyVar, rhs);
  } catch (err) {
    analysisDiv.innerHTML = `<p style="color:red;">
      Error defining function: ${err.message}
    </p>`;
    return;
  }

  // Now we do domain analysis, derivative, range, etc.
  // BUT keep in mind that "argumentExpr" might be "x+7", so this 
  // domain analysis is partially symbolic. We'll treat the right side "rhs" 
  // as if the variable is "u," effectively ignoring "x+7" specifics.

  let html = `<h2>Function: ${functionName}(${argumentExpr}) = ${rhs}</h2>
    <p>(Internally using: ${functionName}(u) = ${rhs})</p>`;

  // Attempt domain analysis on "rhs" as if variableName = "u"
  // Because we can't do perfect domain analysis for "x+7" automatically
  let domainAnalysis = analyzeDomain(rhs, dummyVar);
  html += `<p><strong>Domain (symbolic):</strong> <code>${domainAnalysis.text}</code></p>`;

  // derivative
  let derivativeStr = "N/A";
  try {
    derivativeStr = nerdamer.diff(rhs, dummyVar).text();
  } catch {}
  html += `<p><strong>Derivative w.r.t. u:</strong> 
    <code>${derivativeStr}</code></p>`;

  // critical points
  let criticalPoints = findCriticalPoints(derivativeStr, dummyVar, domainAnalysis);
  if (criticalPoints.length > 0) {
    html += `<p><strong>Critical Points (derivative=0 in u-space):</strong> 
      <code>${JSON.stringify(criticalPoints)}</code></p>`;
  } else {
    html += `<p><strong>Critical Points:</strong> None or not solvable</p>`;
  }

  // y-intercept => We'll try f(0) in terms of "u=0", but that 
  // might not reflect x=someValue if argumentExpr="x+7". 
  let yInt = findYIntercept(functionName, dummyVar, domainAnalysis);
  html += `<p><strong>f(0) in dummyVar space:</strong> <code>${yInt}</code></p>`;

  // x-intercepts => solve f(u)=0
  let xInts = findXIntercepts(functionName, dummyVar, domainAnalysis);
  if (xInts.length > 0) {
    html += `<p><strong>Solutions to f(u)=0:</strong> 
      <code>${JSON.stringify(xInts)}</code></p>`;
  } else {
    html += `<p><strong>Solutions to f(u)=0:</strong> none or none real</p>`;
  }

  // range
  let rangeEst = guessRange(rhs, dummyVar, domainAnalysis, criticalPoints);
  html += `<p><strong>Range (estimated in u-space):</strong> 
    <code>${rangeEst}</code></p>`;

  // indefinite integral
  let indefinite = "N/A";
  try {
    indefinite = nerdamer(`integrate(${rhs},${dummyVar})`).text();
  } catch {}
  html += `<p><strong>Indefinite Integral (w.r.t. u):</strong> 
    <code>∫${rhs} d${dummyVar} = ${indefinite}</code></p>`;

  analysisDiv.innerHTML = html;
}

/************************************************************
 * 3) EVALUATE SINGLE: e.g. "f(3)" or "f(x+7)"
 ************************************************************/
function evaluateSingle(fnName, argStr) {
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // Just do nerdamer("f(3)"). evaluate
  // If the user typed "f(x+7)", we attempt that as well, though 
  // it may or may not be meaningful if we didn't define "x+7" as a variable.
  try {
    let val = nerdamer(`${fnName}(${argStr})`).evaluate().text();
    analysisDiv.innerHTML = `<p><strong>Evaluation:</strong> 
      <code>${fnName}(${argStr}) = ${val}</code></p>`;
  } catch(err) {
    analysisDiv.innerHTML = `<p style="color:red;">
      Error evaluating ${fnName}(${argStr}): ${err.message}
    </p>`;
  }
}

/************************************************************
 * 4) ADVANCED HELPER FUNCTIONS (Unchanged from your domain, 
 *    derivative, intercept code)
 ************************************************************/

function analyzeDomain(expr, variable) {
  let constraints = [];
  let logRegex = /\blog\s*\(\s*([^)]+)\)|\bln\s*\(\s*([^)]+)\)/g;
  let match;
  while((match = logRegex.exec(expr)) !== null) {
    let inside = match[1] || match[2];
    constraints.push(`${inside}>0`);
  }

  let sqrtRegex = /sqrt\s*\(\s*([^)]+)\)/g;
  while((match = sqrtRegex.exec(expr)) !== null) {
    let inside = match[1];
    constraints.push(`${inside}>=0`);
  }

  let domainText = "(-∞,∞)";
  let intervals = [ {start:-Infinity, end:Infinity, openStart:false, openEnd:false} ];

  try {
    let symbolic = nerdamer(expr);
    let denomSym = symbolic.getDenom();
    if (denomSym && denomSym.text() !== "1") {
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

  let text = (constraints.length>0) 
    ? constraints.join(" & ") 
    : "No explicit constraints => all reals";

  return { intervals, text };
}

function parseNerdamerSolve(s) {
  s = s.replace(/\s/g,'');
  if(!s) return [];
  if(s.startsWith("[")) {
    let inside = s.slice(1,-1);
    return inside.split(',').map(x=>x.trim());
  }
  if(s.includes("=")) {
    let eqParts = s.split("=");
    if(eqParts.length>1) return [eqParts[1]];
  }
  if(s.startsWith("{")) {
    let inside = s.slice(1,-1);
    let eqp = inside.split(":");
    if(eqp.length>1) return [eqp[1]];
  }
  return [s];
}

function findCriticalPoints(derivativeStr, variable, domainAnalysis) {
  if(!derivativeStr || derivativeStr==="0" || derivativeStr==="N/A") return [];
  let solutions = [];
  try {
    let sol = nerdamer(`solve(${derivativeStr}=0, ${variable})`).evaluate().text();
    let arr = parseNerdamerSolve(sol);
    solutions = arr;
  } catch(e){}
  return solutions;
}

function findYIntercept(fnName, variable, domainAnalysis) {
  try {
    let val = nerdamer(`${fnName}(0)`).evaluate().text();
    return `(0, ${val})`;
  } catch(e) {
    return "N/A";
  }
}

function findXIntercepts(fnName, variable, domainAnalysis) {
  try {
    let sol = nerdamer(`solve(${fnName}(${variable})=0, ${variable})`).evaluate().text();
    return parseNerdamerSolve(sol);
  } catch(e) {
    return [];
  }
}

function guessRange(expr, variable, domainAnalysis, criticalPoints) {
  let sampleXs = [];
  let domainStr = domainAnalysis.text;
  let minDomain = -Infinity;
  let maxDomain = Infinity;
  let constraints = domainStr.split("&");

  constraints.forEach(c=>{
    let m = c.match(/(x)([><]=?)([\d\.]+)/);
    if(m) {
      let op = m[2];
      let val = parseFloat(m[3]);
      if(op===">=" || op===">") {
        if(val>minDomain) minDomain = val;
      } else if(op==="<=" || op==="<") {
        if(val<maxDomain) maxDomain = val;
      }
    }
  });

  if(Number.isFinite(minDomain)) sampleXs.push(minDomain);
  if(Number.isFinite(maxDomain)) sampleXs.push(maxDomain);

  criticalPoints.forEach(cp=>{
    let num = parseFloat(cp);
    if(!isNaN(num)) sampleXs.push(num);
  });

  let vals=[];
  sampleXs.forEach(x=>{
    if(x>=minDomain && x<=maxDomain) {
      let replaced = expr.replace(new RegExp(variable,"g"), `(${x})`);
      try {
        let val = eval(replaced);
        vals.push(val);
      } catch{}
    }
  });

  if(vals.length<1) {
    return "No finite sample points. Possibly (-∞,∞) or more complex. Additional numeric scanning recommended.";
  }
  let minVal = Math.min(...vals);
  let maxVal = Math.max(...vals);

  if(minVal===maxVal) {
    return `{${minVal}} (constant or single sample)`;
  }
  if(!Number.isFinite(minDomain) || !Number.isFinite(maxDomain)) {
    return `~[${minVal}, ${maxVal}] from samples, domain extends => range might be bigger.`;
  }
  return `[${minVal}, ${maxVal}] (estimated from domain boundaries + critical points).`;
}

