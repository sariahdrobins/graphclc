/*********************************************************
 * 1) SINGLE ENTRY POINT 
 *    The user can type either:
 *      "f(x)= (some expression)"   (define & analyze)
 *    or 
 *      "f(3)"                      (evaluate)
 *    in the same <input id="funcLine"> 
 *********************************************************/
function fXSingleApproach() {
  const input = document.getElementById('funcLine').value.trim();
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // If user typed "f(x)=...", assume define mode
  if (input.includes('=') && /\w+\(\w+\)=/.test(input)) {
    defineAndAnalyzeSingle(input);
  } 
  else {
    // Possibly "f(3)" => direct evaluation
    const evalMatch = input.match(/^(\w+)\(([^)]+)\)$/);
    if (evalMatch) {
      const fnName = evalMatch[1];
      const arg    = evalMatch[2];
      evaluateSingle(fnName, arg);
    } else {
      // Not recognized
      analysisDiv.innerHTML = `
        <p style="color:red;">Error: Type "f(x)=..." or "f(3)".</p>
      `;
    }
  }
}

/*********************************************************
 * 2) DEFINE + ANALYZE
 *    e.g. "f(x)=(x+7)-3"
 *********************************************************/
function defineAndAnalyzeSingle(rawInput) {
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  let [lhs, rhs] = rawInput.split('=').map(s => s.trim()); 
  // e.g. lhs="f(x)", rhs="(x+7)-3"

  let fnMatch = lhs.match(/^(\w+)\((\w+)\)$/);
  if(!fnMatch) {
    analysisDiv.innerHTML = `<p style="color:red;">Error: must be "f(x)=..."</p>`;
    return;
  }
  let functionName = fnMatch[1]; // "f"
  let variableName = fnMatch[2]; // "x"

  // 1) define in Nerdamer
  try {
    nerdamer.setFunction(functionName, variableName, rhs);
  } catch(err) {
    analysisDiv.innerHTML = `<p style="color:red;">Error defining function: ${err.message}</p>`;
    return;
  }

  // 2) We'll expand + simplify to see if it's linear => if so, produce 6 results
  let exprSimpl;
  try {
    exprSimpl = nerdamer(rhs).expand().text(); 
  } catch(e) {
    exprSimpl = rhs; 
  }

  // 2a) Check if linear
  if (isLinearExpression(exprSimpl)) {
    // produce your 6 results for linear
    analysisDiv.innerHTML = `<h2>f(x) = ${exprSimpl}</h2>`
      + produceLinearResults(exprSimpl);
  } else {
    // fallback advanced domain/derivative from older snippet
    // We'll produce domain, derivative, intercept, range, indefinite integral, etc.
    let advHTML = `<h2>f(${variableName}) = ${exprSimpl}</h2>`;
    advHTML += doAdvancedAnalysis(exprSimpl, variableName);
    analysisDiv.innerHTML = advHTML;
  }
}

/*********************************************************
 * 3) EVALUATE SINGLE: e.g. "f(3)"
 *********************************************************/
function evaluateSingle(fnName, arg) {
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';
  try {
    let val = nerdamer(`${fnName}(${arg})`).evaluate().text();
    analysisDiv.innerHTML = `<p><strong>Evaluation:</strong> 
      <code>${fnName}(${arg}) = ${val}</code></p>`;
  } catch(err) {
    analysisDiv.innerHTML = `<p style="color:red;">
      Error evaluating ${fnName}(${arg}): ${err.message}
    </p>`;
  }
}

/*********************************************************
 * 4) isLinearExpression(exprSimpl):
 *    Checks if "x+4", "2x-3", "-5x+10", or just a number => linear
 *    returns true/false
 *********************************************************/
function isLinearExpression(expr) {
  // Remove spaces
  let s = expr.replace(/\s+/g,'');
  // A quick naive check for patterns:
  // e.g. "([+-]?\d*\.?\d*)?x([+-]?\d+\.?\d*)?" or just a number
  const linearRegex = /^([+-]?\d*\.?\d*)?x([+-]\d+\.?\d*)?$|^[+-]?\d+(\.\d+)?$/i;
  return linearRegex.test(s);
}

/*********************************************************
 * 5) produceLinearResults(exprSimpl):
 *   exactly 6 results: Domain, x-int, y-int, slope, inverse, range
 *********************************************************/
function produceLinearResults(exprSimpl) {
  // parse slope(a) and intercept(b)
  let a=0, b=0;
  let s = exprSimpl.replace(/\s+/g,'');
  
  // Attempt to match "something x something"
  const match = s.match(/^([+-]?[\d\.]*)?x([+-]\d+\.?\d*)?$/i);
  
  if(match) {
    // e.g. "x+4", match[1] might be "", match[2] might be "+4"
    let slopeStr = match[1];
    if(slopeStr===""||slopeStr==="+") slopeStr="1";
    if(slopeStr==="-") slopeStr="-1";
    if(!slopeStr) slopeStr="0";
    
    a = parseFloat(slopeStr);
    let interceptStr = match[2] || "0";
    b = parseFloat(interceptStr);
  } else {
    // maybe it's just a number => slope=0, intercept=that
    let n = parseFloat(s);
    if(!isNaN(n)) {
      a=0; b=n;
    } else {
      return `<p style="color:red;">Cannot parse ${exprSimpl} as linear</p>`;
    }
  }

  // 1) domain => all reals
  let domain = "(-∞, ∞)";

  // 2) x-int => if a!=0 => -b/a, else check b
  let xInt="None or none real";
  if(a!==0) {
    let xintVal = -b/a;
    xInt=`(${xintVal}, 0)`;
  } else {
    if(b===0) {
      xInt="Infinite solutions (the line is y=0)";
    } else {
      xInt="None (horizontal line not crossing y=0)";
    }
  }

  // 3) y-int => (0,b)
  let yInt=`(0, ${b})`;

  // 4) slope => a
  let slopeStr = a.toString();

  // 5) inverse => if a=0 => no inverse. otherwise f^-1(x)=(x-b)/a
  let invStr="No inverse for slope=0";
  if(a!==0) {
    invStr=`f⁻¹(x) = (x - ${b}) / ${a}`;
  }

  // 6) range => if a=0 => {b}, else all reals
  let range="(-∞, ∞)";
  if(a===0) {
    range=`{${b}}`;
  }

  return `
    <p><strong>Domain:</strong> <code>${domain}</code></p>
    <p><strong>x-intercept:</strong> <code>${xInt}</code></p>
    <p><strong>y-intercept:</strong> <code>${yInt}</code></p>
    <p><strong>Slope (m):</strong> <code>${slopeStr}</code></p>
    <p><strong>Inverse:</strong> <code>${invStr}</code></p>
    <p><strong>Range:</strong> <code>${range}</code></p>
  `;
}

/*********************************************************
 * 6) doAdvancedAnalysis(exprSimpl, variableName):
 *    The advanced domain/derivative approach from your snippet.
 *    Produces domain, derivative, intercepts, range, indefinite integral
 *********************************************************/
function doAdvancedAnalysis(exprSimpl, variableName) {
  let outHTML="";

  // a) Domain
  let domainAnalysis = analyzeDomain(exprSimpl, variableName);
  outHTML += `<p><strong>Domain (Intervals):</strong> 
    <code>${domainAnalysis.text}</code></p>`;

  // b) Derivative
  let derivativeStr = "N/A";
  try {
    derivativeStr = nerdamer.diff(exprSimpl, variableName).text();
  } catch {}
  outHTML += `<p><strong>Derivative:</strong> 
    <code>${derivativeStr}</code></p>`;

  // c) We'll find critical points
  let criticalPoints = findCriticalPoints(derivativeStr, variableName, domainAnalysis);
  if(criticalPoints.length>0) {
    outHTML += `<p><strong>Critical Points (derivative=0):</strong> 
      <code>${JSON.stringify(criticalPoints)}</code></p>`;
  } else {
    outHTML += `<p><strong>Critical Points:</strong> 
      None or not solvable</p>`;
  }

  // d) y-intercept => f(0)
  let yInt="N/A";
  try {
    let val = nerdamer(`(${exprSimpl}).evaluateAt(${variableName},0)`).text();
    yInt = `(0, ${val})`;
  } catch(e){}
  outHTML += `<p><strong>y-intercept:</strong> 
    <code>${yInt}</code></p>`;

  // e) x-intercepts => solve f(x)=0
  let xIntercepts=[];
  try {
    let sol= nerdamer(`solve(${exprSimpl}=0, ${variableName})`).evaluate().text();
    xIntercepts= parseNerdamerSolve(sol);
  } catch(e){}
  if(xIntercepts.length>0) {
    outHTML += `<p><strong>x-intercepts:</strong> 
      <code>${JSON.stringify(xIntercepts)}</code></p>`;
  } else {
    outHTML += `<p><strong>x-intercepts:</strong> 
      None or none real</p>`;
  }

  // f) range => naive approach using guessRange
  let rangeEst = guessRange(exprSimpl, variableName, domainAnalysis, criticalPoints);
  outHTML += `<p><strong>Range (estimated):</strong> 
    <code>${rangeEst}</code></p>`;

  // g) Indefinite integral
  let indefinite="N/A";
  try {
    indefinite= nerdamer(`integrate(${exprSimpl}, ${variableName})`).text();
  } catch {}
  outHTML += `<p><strong>Indefinite Integral:</strong> 
    <code>∫${exprSimpl} d${variableName} = ${indefinite}</code></p>`;

  return outHTML;
}

/*********************************************************
 * 7) The same domain, parse, criticalPoints, intercept, range 
 *    from your original snippet
 *********************************************************/
function analyzeDomain(expr, variable){ 
  let constraints=[];
  let logRegex=/\blog\s*\(\s*([^)]+)\)|\bln\s*\(\s*([^)]+)\)/g;
  let match;
  while((match=logRegex.exec(expr))!==null){
    let inside = match[1]||match[2];
    constraints.push(`${inside}>0`);
  }

  let sqrtRegex=/sqrt\s*\(\s*([^)]+)\)/g;
  while((match=sqrtRegex.exec(expr))!==null){
    let inside=match[1];
    constraints.push(`${inside}>=0`);
  }

  let domainText="(-∞,∞)";
  let intervals=[{start:-Infinity,end:Infinity,openStart:false,openEnd:false}];

  try {
    let symbolic= nerdamer(expr);
    let denomSym=symbolic.getDenom();
    if(denomSym && denomSym.text()!=="1"){
      let zeros= nerdamer(`solve(${denomSym.text()}=0, ${variable})`).evaluate().text();
      let zeroVals= parseNerdamerSolve(zeros);
      zeroVals.forEach(zv=>{
        let num= parseFloat(zv);
        if(!isNaN(num)){
          constraints.push(`${variable}!=${num}`);
        }
      });
    }
  } catch(e){}

  let text= (constraints.length>0)? constraints.join(" & "):"No explicit constraints => all reals";
  return { intervals, text };
}

function parseNerdamerSolve(s){
  s=s.replace(/\s/g,'');
  if(!s)return[];
  if(s.startsWith("[")){
    let inside=s.slice(1,-1);
    return inside.split(',').map(x=>x.trim());
  }
  if(s.includes("=")){
    let eqParts=s.split("=");
    if(eqParts.length>1)return[eqParts[1]];
  }
  if(s.startsWith("{")){
    let inside=s.slice(1,-1);
    let eqp=inside.split(":");
    if(eqp.length>1) return[eqp[1]];
  }
  return[s];
}

function findCriticalPoints(derivativeStr, variable, domainAnalysis){
  if(!derivativeStr||derivativeStr==="0"||derivativeStr==="N/A")return[];
  let solutions=[];
  try{
    let sol= nerdamer(`solve(${derivativeStr}=0, ${variable})`).evaluate().text();
    let arr= parseNerdamerSolve(sol);
    solutions=arr;
  }catch(e){}
  return solutions;
}

function guessRange(expr, variable, domainAnalysis, criticalPoints){
  let sampleXs=[];
  let domainStr=domainAnalysis.text;
  let minDomain=-Infinity;
  let maxDomain=Infinity;
  let constraints=domainStr.split("&");

  constraints.forEach(c=>{
    let m=c.match(/(x)([><]=?)([\d\.]+)/);
    if(m){
      let op=m[2];
      let val=parseFloat(m[3]);
      if(op===">="||op===">"){
        if(val>minDomain) minDomain=val;
      }else if(op==="<="||op==="<"){
        if(val<maxDomain)maxDomain=val;
      }
    }
  });

  if(Number.isFinite(minDomain)) sampleXs.push(minDomain);
  if(Number.isFinite(maxDomain)) sampleXs.push(maxDomain);

  criticalPoints.forEach(cp=>{
    let num=parseFloat(cp);
    if(!isNaN(num))sampleXs.push(num);
  });

  let vals=[];
  sampleXs.forEach(x=>{
    if(x>=minDomain && x<=maxDomain){
      let replaced= expr.replace(new RegExp(variable,"g"), `(${x})`);
      try{
        let val= eval(replaced);
        vals.push(val);
      }catch{}
    }
  });

  if(vals.length<1){
    return "No finite sample points. Possibly (-∞,∞) or more complex. Additional numeric scanning recommended.";
  }
  let minVal=Math.min(...vals);
  let maxVal=Math.max(...vals);

  if(minVal===maxVal){
    return `{${minVal}} (seems constant or single sample)`;
  }
  if(!Number.isFinite(minDomain)||!Number.isFinite(maxDomain)){
    return `~[${minVal}, ${maxVal}] from samples, domain extends => range might be bigger.`;
  }
  return `[${minVal}, ${maxVal}] (estimated from domain boundaries + critical points).`;
}
