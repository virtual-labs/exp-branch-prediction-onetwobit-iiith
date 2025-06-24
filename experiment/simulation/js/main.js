// Global variables to maintain state
let program = '';
let coloredProgram = '';
let sequence = '';
let coloredTrace = '';
let predictorType = '1bit';
let results = [];
let summary = '';

// Examples data
const examples = [
    {
        title: 'Example 1: For Loop',
        code: `MOV R0, 0
MOV R1, 5
MOV R2, 3
MOV R3, 1
LOOP:
ADD R0, R0, R3
BEQ R0, R1, END
ADD R2, R2, R3
BNE R1, R0, LOOP
END:
NOP`,
        trace: 'B0:N, B1:T, B0:N, B1:T, B0:N, B1:T, B0:N, B1:T, B0:T'
    },
    {
        title: 'Example 2: For Loop with if statement',
        code: `MOV R0, 0
MOV R1, 0
MOV R2, 10
MOV R3, 1
LOOP:
AND R4, R0, R3
BNE R4, R3, CONT
ADD R1, R1, R3
CONT:
ADD R0, R0, R3
BNE R0, R2, LOOP
END:
NOP`,
        trace: 'B0:T, B1:T, B0:N, B1:T, B0:T, B1:T, B0:N, B1:T, B0:T, B1:T, B0:N, B1:T, B0:T, B1:T, B0:N, B1:T, B0:T, B1:T, B0:N, B1:N'
    },
    {
        title: 'Example 3: Multiple Iterations',
        code: `MOV R0, 0
MOV R1, 0
MOV R2, 0
MOV R3, 0
MOV R4, 1
MOV R5, 3
MOV R6,10
LOOP:
AND R7, R0, R4
BNE R7, R3, SKIP_EVEN
ADD R1, R1, R4
SKIP_EVEN:
MOV R8, 5
BNE R0, R8, SKIP_FIVE
SUB R2, R2, R4
SKIP_FIVE:
ADD R3, R3, R4
BNE R3, R5, SKIP_MULT
MOV R3, 0
ADD R2, R2, R4
SKIP_MULT:
ADD R0, R0, R4
BNE R0, R6, LOOP
END:
NOP`,
        trace: 'B0:N,B1:T,B2:T,B3:T,B0:N,B1:T,B2:T,B3:T,B0:T,B1:T,B2:N,B3:T,B0:T,B1:T,B2:T,B3:T,B0:T,B1:T,B2:T,B3:T,B0:T,B1:N,B2:N,B3:T,B0:N,B1:T,B2:T,B3:T,B0:N,B1:T,B2:T,B3:T,B0:T,B1:T,B2:N,B3:T,B0:T,B1:T,B2:T,B3:N'
    }
];

// Branch trace generation function
function generateBranchTrace(code) {
    const lines = code
        .split(/\n+/)
        .map(l => l.trim())
        .filter(Boolean);

    const registers = Array(10).fill(0);
    const labelMap = {};
    const program = [];
    const branchColors = [
        '#ff6b6b','#4ecdc4','#45b7d1','#96ceb4',
        '#feca57','#ff9ff3','#54a0ff','#5f27cd'
    ];
    const branchColorMap = {};
    let branchIdCounter = 0;

    // First pass: build labelMap and assign branch IDs
    lines.forEach(line => {
        const m = line.match(/^(\w+):/);
        let instr = line;
        if (m) {
            labelMap[m[1]] = program.length;
            const rest = line.replace(/^(\w+):/, '').trim();
            if (!rest) return;
            instr = rest;
        }
        const op = instr.split(/[ ,]+/)[0].toUpperCase();
        if (op === 'BEQ' || op === 'BNE') {
            branchColorMap[program.length] = {
                color: branchColors[branchIdCounter % branchColors.length],
                id: branchIdCounter++
            };
        }
        program.push(instr);
    });

    // Colorize program for display
    let idx = 0;
    let coloredProgramHTML = '';
    lines.forEach(line => {
        const m = line.match(/^(\w+):/);
        let disp = line;
        if (m) {
            const rest = line.replace(/^(\w+):/, '').trim();
            if (rest) {
                const op = rest.split(/[ ,]+/)[0].toUpperCase();
                if (op === 'BEQ' || op === 'BNE') {
                    const info = branchColorMap[idx];
                    disp = `${m[0]} <span style="background:${info.color};color:#fff;padding:2px 4px;border-radius:3px">${rest}</span>`;
                }
                idx++;
            }
        } else {
            const op = line.split(/[ ,]+/)[0].toUpperCase();
            if (op === 'BEQ' || op === 'BNE') {
                const info = branchColorMap[idx];
                disp = `<span style="background:${info.color};color:#fff;padding:2px 4px;border-radius:3px">${line}</span>`;
            }
            idx++;
        }
        coloredProgramHTML += disp + '\n';
    });

    // Execute program
    let pc = 0;
    const output = [];
    let safety = 10000;
    while (pc < program.length && safety-- > 0) {
        const parts = program[pc].split(/[ ,]+/);
        const op = parts[0].toUpperCase();

        switch(op) {
            case 'MOV': {
                const rd = +parts[1].slice(1);
                const imm = parseInt(parts[2], 10);
                registers[rd] = imm;
                pc++;
                break;
            }
            case 'ADD': {
                const rd = +parts[1].slice(1);
                const rs1 = +parts[2].slice(1);
                const rs2 = +parts[3].slice(1);
                registers[rd] = registers[rs1] + registers[rs2];
                pc++;
                break;
            }
            case 'SUB': {
                const rd = +parts[1].slice(1);
                const rs1 = +parts[2].slice(1);
                const rs2 = +parts[3].slice(1);
                registers[rd] = registers[rs1] - registers[rs2];
                pc++;
                break;
            }
            case 'AND': {
                const rd = +parts[1].slice(1);
                const rs1 = +parts[2].slice(1);
                const rs2 = +parts[3].slice(1);
                registers[rd] = registers[rs1] & registers[rs2];
                pc++;
                break;
            }
            case 'BEQ':
            case 'BNE': {
                const r1 = +parts[1].slice(1);
                const r2 = +parts[2].slice(1);
                const lbl = parts[3];
                const taken = op === 'BEQ'
                    ? registers[r1] === registers[r2]
                    : registers[r1] !== registers[r2];
                const info = branchColorMap[pc];
                output.push(`B${info.id}:${taken ? 'T' : 'N'}`);
                pc = taken && labelMap[lbl] != null ? labelMap[lbl] : pc + 1;
                break;
            }
            default:
                pc++;
        }
    }

    const trace = output.join(',');
    const coloredTraceHTML = output
        .map(item => {
            const match = item.match(/^B(\d+)/);
            if (!match) return item;
            const idNum = +match[1];
            const colorInfo = Object.values(branchColorMap).find(b => b.id === idNum);
            const color = colorInfo ? colorInfo.color : '#000';
            return `<span style="background:${color};color:#fff;padding:2px 4px;border-radius:3px;margin-right:8px">${item}</span>`;
        })
        .join(' ');

    return { trace, coloredProgramHTML, coloredTraceHTML };
}

// Simulation function
function runSimulation(predictorType, input) {
    const outcomes = input.split(',').map(x => x.trim().toUpperCase());
    const stateMap = new Map();
    const branchColors = [
        '#ff6b6b','#4ecdc4','#45b7d1','#96ceb4',
        '#feca57','#ff9ff3','#54a0ff','#5f27cd'
    ];
    const branchColorMap = {};
    let idx = 0;
    outcomes.forEach(o => {
        const id = o.split(':')[0];
        if (!branchColorMap[id]) {
            branchColorMap[id] = branchColors[idx++ % branchColors.length];
        }
    });

    let correct = 0;
    const rows = outcomes.map((o, i) => {
        const [id, actual] = o.split(':');
        if (!stateMap.has(id)) {
            stateMap.set(id, predictorType === '1bit' ? 'T' : '11');
        }
        const stateBefore = stateMap.get(id);
        let prediction;
        let stateAfter;

        if (predictorType === '1bit') {
            prediction = stateBefore;
            const match = prediction === actual;
            stateAfter = actual;
            stateMap.set(id, stateAfter);
            if (match) correct++;
            return { 
                step: i + 1, 
                id, 
                actual, 
                prediction, 
                correct: match, 
                stateBefore, 
                stateAfter, 
                color: branchColorMap[id] 
            };
        } else {
            let val = parseInt(stateBefore, 2);
            prediction = val >= 2 ? 'T' : 'N';
            const match = prediction === actual;
            val = actual === 'T' ? Math.min(val + 1, 3) : Math.max(val - 1, 0);
            stateAfter = val.toString(2).padStart(2, '0');
            stateMap.set(id, stateAfter);
            if (match) correct++;
            return { 
                step: i + 1, 
                id, 
                actual, 
                prediction, 
                correct: match, 
                stateBefore, 
                stateAfter, 
                color: branchColorMap[id] 
            };
        }
    });

    const summaryText = `Accuracy: ${correct}/${outcomes.length} = ${((100 * correct)/outcomes.length).toFixed(2)}%`;
    return { rows, summaryText };
}

// Event handlers
function handleGenerate() {
    const programInput = document.getElementById('program-input');
    program = programInput.value;
    
    if (!program.trim()) {
        alert('Please enter some assembly code first.');
        return;
    }
    
    const { trace, coloredProgramHTML, coloredTraceHTML } = generateBranchTrace(program);
    coloredProgram = coloredProgramHTML;
    sequence = trace;
    coloredTrace = coloredTraceHTML;
    
    // Update sequence input
    document.getElementById('sequence-input').value = sequence;
    
    // Show colored program
    const coloredProgramDiv = document.getElementById('colored-program');
    coloredProgramDiv.innerHTML = coloredProgram;
    coloredProgramDiv.style.display = 'block';
    
    // Show trace section
    const traceSection = document.getElementById('trace-section');
    const coloredTraceDiv = document.getElementById('colored-trace');
    coloredTraceDiv.innerHTML = coloredTrace;
    traceSection.style.display = 'block';
}

function handleRun() {
    const sequenceInput = document.getElementById('sequence-input');
    sequence = sequenceInput.value;
    
    if (!sequence.trim()) {
        alert('Please enter a branch sequence first.');
        return;
    }
    
    const { rows, summaryText } = runSimulation(predictorType, sequence);
    results = rows;
    summary = summaryText;
    
    // Display results
    displayResults();
}

function handleReset() {
    program = '';
    coloredProgram = '';
    sequence = '';
    coloredTrace = '';
    results = [];
    summary = '';
    
    // Clear form inputs
    document.getElementById('program-input').value = '';
    document.getElementById('sequence-input').value = '';
    
    // Hide displays
    document.getElementById('colored-program').style.display = 'none';
    document.getElementById('trace-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
}

function handleCopyExample(code) {
    const programInput = document.getElementById('program-input');
    programInput.value = code;
    program = code;
    
    // Try to copy to clipboard
    navigator.clipboard.writeText(code).catch(() => {
        alert('Copy failed');
    });
}

function handlePredictorTypeChange() {
    const checkbox = document.getElementById('predictor-type');
    const predictorText = document.getElementById('predictor-text');
    
    predictorType = checkbox.checked ? '2bit' : '1bit';
    predictorText.textContent = checkbox.checked ? 'Two-Bit Predictor' : 'One-Bit Predictor';
}

function displayResults() {
    const resultsSection = document.getElementById('results-section');
    const tbody = document.getElementById('results-tbody');
    const summaryDiv = document.getElementById('summary');
    
    // Clear previous results
    tbody.innerHTML = '';
    
    // Populate results table
    results.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.step}</td>
            <td>
                <span class="branch-badge" style="background: ${r.color}">
                    ${r.id}
                </span>
            </td>
            <td class="monospace">${r.actual}</td>
            <td class="monospace">${r.prediction}</td>
            <td class="${r.correct ? 'correct-yes' : 'correct-no'}">
                ${r.correct ? '✓ Yes' : '✗ No'}
            </td>
            <td class="state-cell">${r.stateBefore}</td>
            <td class="state-cell">${r.stateAfter}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Show summary
    if (summary) {
        summaryDiv.textContent = summary;
        summaryDiv.style.display = 'block';
    }
    
    // Show results section
    resultsSection.style.display = 'block';
}

function populateExamples() {
    const container = document.getElementById('examples-container');
    
    examples.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'example-card';
        card.innerHTML = `
            <h4 class="example-title">${ex.title}</h4>
            <pre class="example-code">${ex.code}</pre>
            <p class="example-trace">
                <span class="trace-label">Expected Trace: </span>
                <span class="trace-value">${ex.trace}</span>
            </p>
            <button class="btn primary small" onclick="handleCopyExample(\`${ex.code}\`)">
                Copy Example
            </button>
        `;
        container.appendChild(card);
    });
}

// Initialize the application
function init() {
    // Populate examples
    populateExamples();
    
    // Add event listeners
    document.getElementById('generate-btn').addEventListener('click', handleGenerate);
    document.getElementById('run-btn').addEventListener('click', handleRun);
    document.getElementById('clear-btn').addEventListener('click', handleReset);
    document.getElementById('reset-btn').addEventListener('click', handleReset);
    document.getElementById('predictor-type').addEventListener('change', handlePredictorTypeChange);
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
