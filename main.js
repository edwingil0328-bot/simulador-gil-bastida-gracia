let app3d;
let chart2d;
let currentStep = 1;
let numFloors = 1;

document.addEventListener('DOMContentLoaded', () => {
    app3d = new App3D('canvas-3d-container');
    initChart2D();
    setupEventListeners();
    updateAll();
});

function goToStep(step) {
    currentStep = step;

    document.querySelectorAll('.step-btn').forEach(btn => {
        const bStep = parseInt(btn.getAttribute('data-step'));
        btn.classList.toggle('active', bStep === step);
    });

    document.querySelectorAll('.phase-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    document.getElementById(`phase-${step}`).classList.remove('hidden');

    const tags = [
        "Visor 3D: Fase 1 - Terreno y Levantamiento Topográfico",
        "Visor 3D: Fase 2 - Delimitación y Área de Lote A(x)",
        "Visor 3D: Fase 3 - Edificación Progresiva Piso a Piso",
        "Visor 3D: Fase 4 - Simulación Solar & Sombras Bioclimáticas",
        "Visor 3D: Fase 5 - Consolidado de Ficha Técnica"
    ];
    document.getElementById('viewport-tag').innerText = tags[step - 1];

    updateAll();
}

function changeFloors(delta) {
    numFloors = Math.max(1, Math.min(10, numFloors + delta));
    document.getElementById('num-pisos-display').innerText = numFloors;
    updateAll();
}

function setupEventListeners() {
    const inputs = [
        'cota-h', 'topo-x', 'topo-y', 'pendiente',
        'lote-x', 'lote-b', 'piso-altura',
        'hora-sol', 'costo-m2', 'costo-m3', 'costo-fijo'
    ];

    inputs.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('input', () => updateAll());
        }
    });
}

function updateAll() {
    const cotaH = parseFloat(document.getElementById('cota-h').value) || 2500;
    const topoX = parseFloat(document.getElementById('topo-x').value);
    const topoY = parseFloat(document.getElementById('topo-y').value);
    const pendiente = parseFloat(document.getElementById('pendiente').value);

    const loteX = parseFloat(document.getElementById('lote-x').value);
    const loteB = parseFloat(document.getElementById('lote-b').value);

    const pisoAltura = parseFloat(document.getElementById('piso-altura').value);
    const horaSol = parseFloat(document.getElementById('hora-sol').value);

    const costoM2 = parseFloat(document.getElementById('costo-m2').value);
    const costoM3 = parseFloat(document.getElementById('costo-m3').value);
    const costoFijo = parseFloat(document.getElementById('costo-fijo').value);

    document.getElementById('topo-x-val').innerText = `${topoX.toFixed(2)} m`;
    document.getElementById('topo-y-val').innerText = `${topoY.toFixed(2)} m`;
    document.getElementById('lote-x-val').innerText = `${loteX.toFixed(2)} m`;
    document.getElementById('lote-b-val').innerText = `${loteB.toFixed(2)} m`;
    document.getElementById('hora-sol-val').innerText = `${Math.floor(horaSol)}:${(horaSol % 1 * 60).toString().padStart(2, '0')} hrs`;

    const topoArea = MathEngine.round(topoX * topoY);
    const topoVc = MathEngine.calculateExcavationVolume(topoArea, pendiente);

    document.getElementById('topo-area').innerText = topoArea.toFixed(2);
    document.getElementById('topo-vc').innerText = topoVc.toFixed(2);

    const loteYCalc = MathEngine.round(Math.max(0, loteB - loteX));
    const loteArea = MathEngine.calculateArea(loteX, loteB);
    const vertex = MathEngine.calculateVertex(loteB);
    const eficiencia = MathEngine.calculateEfficiency(loteArea, vertex.amax);

    document.getElementById('lote-y-calc').innerText = loteYCalc.toFixed(2);
    document.getElementById('lote-area-calc').innerText = loteArea.toFixed(2);
    document.getElementById('lote-xv').innerText = vertex.xv.toFixed(2);
    document.getElementById('lote-amax').innerText = vertex.amax.toFixed(2);
    document.getElementById('lote-eficiencia').innerText = eficiencia.toFixed(2);

    const alturaTotal = MathEngine.round(numFloors * pisoAltura);
    const areaConstruidaTotal = MathEngine.round(loteArea * numFloors);
    const volumenConstruido = MathEngine.round(areaConstruidaTotal * pisoAltura);

    document.getElementById('altura-total').innerText = alturaTotal.toFixed(2);
    document.getElementById('area-construida').innerText = areaConstruidaTotal.toFixed(2);
    document.getElementById('volumen-construido').innerText = volumenConstruido.toFixed(2);

    const costos = MathEngine.calculateTotalCost(areaConstruidaTotal, costoM2, topoVc, costoM3, costoFijo);

    document.getElementById('costo-const').innerText = costos.costoConstruccion.toLocaleString('es-CO');
    document.getElementById('costo-corte').innerText = costos.costoCorte.toLocaleString('es-CO');
    document.getElementById('costo-total').innerText = costos.total.toLocaleString('es-CO');

    document.getElementById('sum-cota').innerText = `${cotaH} m.s.n.m.`;
    document.getElementById('sum-vertices').innerText = `(0,0), (${topoX},0), (${topoX},${topoY}), (0,${topoY})`;
    document.getElementById('sum-vc').innerText = `${topoVc.toFixed(2)} m³`;
    document.getElementById('sum-b').innerText = loteB;
    document.getElementById('sum-dims').innerText = `${loteX.toFixed(2)} m × ${loteYCalc.toFixed(2)} m`;
    document.getElementById('sum-xv').innerText = `${vertex.xv.toFixed(2)} m (Amax = ${vertex.amax.toFixed(2)} m²)`;
    document.getElementById('sum-pisos').innerText = `${numFloors} Piso(s) (${alturaTotal.toFixed(2)} m)`;
    document.getElementById('sum-presupuesto').innerText = `$${costos.total.toLocaleString('es-CO')}`;

    app3d.renderTerrain(topoX, topoY, pendiente);
    app3d.renderPoligonal(topoX, topoY);

    if (currentStep >= 3) {
        app3d.renderBuilding(loteX, loteYCalc, pisoAltura, numFloors);
    } else {
        app3d.renderBuilding(loteX, loteYCalc, pisoAltura, 0);
    }

    app3d.updateSunPosition(horaSol);
    updateChart2D(currentStep, topoX, topoY, loteB, loteX);
}

function initChart2D() {
    const ctx = document.getElementById('chart-2d').getContext('2d');
    chart2d = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Dimensión X (m)', color: '#94a3b8' },
                    grid: { color: '#334155' },
                    ticks: { color: '#f8fafc' }
                },
                y: {
                    title: { display: true, text: 'Dimensión Y / Área (m²)', color: '#94a3b8' },
                    grid: { color: '#334155' },
                    ticks: { color: '#f8fafc' }
                }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });
}

function updateChart2D(step, topoX, topoY, b, xActual) {
    if (step === 1) {
        document.getElementById('chart-title').innerText = 'Plano Cartesiano Topográfico - Poligonal (2D)';
        chart2d.data.datasets = [{
            label: 'Poligonal Terreno',
            data: [
                { x: 0, y: 0 },
                { x: topoX, y: 0 },
                { x: topoX, y: topoY },
                { x: 0, y: topoY },
                { x: 0, y: 0 }
            ],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
            showLine: true,
            pointRadius: 6,
            pointBackgroundColor: '#f59e0b'
        }];
    } else {
        document.getElementById('chart-title').innerText = 'Curva Parabólica de Área A(x) = -x² + b·x';
        
        const curveData = [];
        for (let x = 0; x <= b; x += b / 30) {
            curveData.push({ x: MathEngine.round(x), y: MathEngine.calculateArea(x, b) });
        }

        const currentArea = MathEngine.calculateArea(xActual, b);
        const vertex = MathEngine.calculateVertex(b);

        chart2d.data.datasets = [
            {
                label: 'A(x) = -x² + b·x',
                data: curveData,
                borderColor: '#38bdf8',
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            },
            {
                label: 'Área Actual',
                data: [{ x: xActual, y: currentArea }],
                backgroundColor: '#10b981',
                pointRadius: 8
            },
            {
                label: 'Vértice Óptimo (Amax)',
                data: [{ x: vertex.xv, y: vertex.amax }],
                backgroundColor: '#f59e0b',
                pointRadius: 8
            }
        ];
    }

    chart2d.update();
}