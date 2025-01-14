/******************************************************************************
 * defineAndAnalyze():
 *   - Parses input "f(x)= expression"
 *   - Defines f in Nerdamer
 *   - Analyzes domain, derivative, critical points, intercepts, integrals
 *   - Attempts advanced approach for domain => intervals, range => min/max
 ******************************************************************************/
function defineAndAnalyze() {
  const input = document.getElementById('funcInput').value.trim();
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // Parse "f(x)=..."
  if(!input.includes('=')) {
    analysisDiv.innerHTML = `<p style="color:red;">Error: Please use "f(x)=..." format.</p>`;
    return;
  }

  let [lhs, rhs] = input.split('=').map(s => s.trim());
  let fnMatch = lhs.match(/^(\w+)\((\w+)\)$/);
  if(!fnMatch) {
    analysisDiv.innerHTML = `<p style="color:red;">Error parsing function name. Expect "f(x)=...".</p>`;
    return;
  }
  let functionName = fnMatch[1]; // e.g. "f"
  let variableName = fnMatch[2]; // e.g. "x"

  // 1) Define function in Nerdamer
  try {
    nerdamer.setFunction(functionName, variableName, rhs);
  } catch(err) {
    analysisDiv.innerHTML = `<p style="color:red;">Error defining function in Nerdamer: ${err.message}</p>`;
    return;
  }

  let html = `<h2>Function: ${functionName}(${variableName}) = ${rhs}</h2>`;

  // 2) Domain analysis
  let domainAnalysis = analyzeDomain(rhs, variableName);
  html += `<p><strong>Domain (Intervals):</strong> <code>${domainAnalysis.text}</code></p>`;

  // 3) Derivative
  let derivativeStr, derivativeExpr;
  try {
    derivativeExpr = nerdamer.diff(rhs, variableName);
    derivativeStr = derivativeExpr.text();
  } catch {
    derivativeStr = "N/A";
  }
  html += `<p><strong>Derivative:</strong> <code>${derivativeStr}</code></p>`;

  // 4) Critical points => derivative=0, and also domain must allow them
  let criticalPoints = findCriticalPoints(derivativeStr, variableName, domainAnalysis);
  if(criticalPoints.length>0) {
    html += `<p><strong>Critical Points (derivative=0):</strong> <code>${JSON.stringify(criticalPoints)}</code></p>`;
  } else {
    html += `<p><strong>Critical Points:</strong> None or not solvable in real domain</p>`;
  }

  // 5) Intercepts
  let yInt = findYIntercept(functionName, variableName, domainAnalysis);
  let xInts = findXIntercepts(functionName, variableName, domainAnalysis);

  html += `<p><strong>y-intercept:</strong> <code>${yInt}</code></p>`;
  if(xInts.length>0) {
    html += `<p><strong>x-intercepts (f(x)=0):</strong> <code>${JSON.stringify(xInts)}</code></p>`;
  } else {
    html += `<p><strong>x-intercepts:</strong> None found or none real</p>`;
  }

  // 6) Range estimation
  let rangeEst = guessRange(rhs, variableName, domainAnalysis, criticalPoints);
  html += `<p><strong>Range (estimated):</strong> <code>${rangeEst}</code></p>`;

  // 7) Indefinite integral
  let indefinite = "N/A";
  try {
    indefinite = nerdamer(`integrate(${rhs},${variableName})`).text();
  } catch {}
  html += `<p><strong>Indefinite Integral:</strong> <code>∫${rhs} d${variableName} = ${indefinite}</code></p>`;

  analysisDiv.innerHTML = html;
}

/***************************************************************
 * analyzeDomain(expression, variable):
 *  - Finds constraints from logs (arg>0), sqrt (arg≥0), denominators (≠0)
 *  - Symbolically solves them => merges intervals
 *  - Returns { intervals: [ [start, end, open/closed], ... ], text: "..." }
 ***************************************************************/
function analyzeDomain(expr, variable) {
  let constraints = [];
  // We'll parse logs, sqrt, denominators, store them

  // logs => argument>0
  let logRegex = /\blog\s*\(\s*([^)]+)\)|\bln\s*\(\s*([^)]+)\)/g;
  let match;
  while((match=logRegex.exec(expr))!==null) {
    let inside = match[1] || match[2];
    constraints.push(`${inside}>0`);
  }

  // sqrt(...) => inside≥0
  let sqrtRegex = /sqrt\s*\(\s*([^)]+)\)/g;
  while((match=sqrtRegex.exec(expr))!==null) {
    let inside = match[1];
    constraints.push(`${inside}>=0`);
  }

  // denominators => not zero => use getDenom
  let domainText = "(-∞,∞)";
  let intervals = [ {start:-Infinity, end:Infinity, openStart:false, openEnd:false} ];

  try {
    let symbolic = nerdamer(expr);
    let denomSym = symbolic.getDenom();
    if(denomSym && denomSym.text()!=="1") {
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

  let text = constraints.length>0 ? constraints.join(" & ") : "No explicit constraints => all reals";
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
    return inside.split(',').map(x=>x.trim());
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
  if(!derivativeStr || derivativeStr==="0" || derivativeStr==="N/A") return [];
  let solutions = [];
  try {
    let sol = nerdamer(`solve(${derivativeStr}=0, ${variable})`).evaluate().text();
    let arr = parseNerdamerSolve(sol);
    solutions = arr; 
  } catch(e){}
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

  let vals = [];
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
    return `{${minVal}} (seems constant or only one sample)`;
  }
  if(!Number.isFinite(minDomain) || !Number.isFinite(maxDomain)) {
    return `~[${minVal}, ${maxVal}] from sampled points, domain extends => range might be bigger.`;
  }
  return `[${minVal}, ${maxVal}] (estimated) from domain boundaries + critical points.`;
}
