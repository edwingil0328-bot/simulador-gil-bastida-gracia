let app3d;
let chart2d;
let currentStep = 1;
let numFloors = 1;

// Coordenadas reales de la libreta de campo de la clase (10 puntos)
const carteraClaseReal = [
    { name: 'P1', E: 113.88, N: 105.05, Z: 2501.20 },
    { name: 'P2', E: 126.13, N: 97.07,  Z: 2500.80 },
    { name: 'P3', E: 118.45, N: 82.20,  Z: 2500.50 },
    { name: 'P4', E: 103.10, N: 76.35,  Z: 2500.10 },
    { name: 'P5', E: 87.50,  N: 81.20,  Z: 2499.80 },
    { name: 'P6', E: 83.56,  N: 95.40,  Z: 2499.50 },
    { name: 'P7', E: 89.20,  N: 108.30, Z: 2500.00 },
    { name: 'P8', E: 101.50, N: 113.97, Z: 2500.60 },
    { name: 'P9', E: 110.20, N: 112.10, Z: 2501.00 },
    { name: 'P10',E: 113.88, N: 105.05, Z: 2501.20 }
];

document.addEventListener('DOMContentLoaded', () => {
    app3d = new App3D('canvas-3d-container');
    initChart2D();
    togglePuntosInput();
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

function togglePuntosInput() {
    const numPuntos = parseInt(document.getElementById('num-puntos').value);
    const rectInputs = document.getElementById('rect-inputs');
    const polyInputs = document.getElementById('poly-inputs');
    const coordsList = document.getElementById('coords-list');

    if (numPuntos === 0) {
        rectInputs.classList.remove('hidden');
        polyInputs.classList.add('hidden');
    } else {
        rectInputs.classList.add('hidden');
        polyInputs.classList.remove('hidden');
        coordsList.innerHTML = '';

        for (let i = 1; i <= numPuntos; i++) {
            // Valores por defecto generados en círculo o polígono simétrico si no es la cartera cargada
            const defaultE = MathEngine.round(100 + 15 * Math.cos((i * 2 * Math.PI) / numPuntos));
            const defaultN = MathEngine.round(100 + 15 * Math.sin((i * 2 * Math.PI) / numPuntos));
            const defaultZ = MathEngine.round(2500 + (i * 0.2));

            const row = document.createElement('div');
            row.className = 'coord-row';
            row.innerHTML = `
                <label>P${i}:</label>
                <input type="number" id="p-${i}-e" value="${defaultE}" step="0.1" onchange="updateAll()">
                <input type="number" id="p-${i}-n" value="${defaultN}" step="0.1" onchange="updateAll()">
                <input type="number" id="p-${i}-z" value="${defaultZ}" step="0.1" onchange="updateAll()">
            `;
            coordsList.appendChild(row);
        }
    }
    updateAll();
}

function cargarCarteraRealClase() {
    document.getElementById('num-puntos').value = "10";
    togglePuntosInput();

    carteraClaseReal.forEach((pt, idx) => {
        const i = idx + 1;
        const elemE = document.getElementById(`p-${i}-e`);
        const elemN = document.getElementById(`p-${i}-n`);
        const elemZ = document.getElementById(`p-${i}-z`);

        if (elemE) elemE.value = pt.E;
        if (elemN) elemN.value = pt.N;
        if (elemZ) elemZ.value = pt.Z;
    });

    updateAll();
}

function getPuntosIngresados() {
    const numPuntos = parseInt(document.getElementById('num-puntos').value);
    if (numPuntos === 0) return [];

    const puntos = [];
    for (let i = 1; i <= numPuntos; i++) {
        const elemE = document.getElementById(`p-${i}-e`);
        const elemN = document.getElementById(`p-${i}-n`);
        const elemZ = document.getElementById(`p-${i}-z`);

        if (elemE && elemN) {
            puntos.push({
                name: `P${i}`,
                E: parseFloat(elemE.value) || 0,
                N: parseFloat(elemN.value) || 0,
                Z: parseFloat(elemZ ? elemZ.value : 2500)
            });
        }
    }
    return puntos;
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
    const numPuntos = parseInt(document.getElementById('num-puntos').value);
    const puntos = getPuntosIngresados();

    let topoX = parseFloat(document.getElementById('topo-x').value);
    let topoY = parseFloat(document.getElementById('topo-y').value);
    let manualPendiente = parseFloat(document.getElementById('pendiente').value);

    let topoArea = 0;
    let seqSlope;

    if (numPuntos === 0) {
        document.getElementById('topo-x-val').innerText = `${topoX.toFixed(2)} m`;
        document.getElementById('topo-y-val').innerText = `${topoY.toFixed(2)} m`;
        topoArea = MathEngine.round(topoX * topoY);
        seqSlope = MathEngine.calculateSlopeSequence([], manualPendiente);
    } else {
        topoArea = MathEngine.calculatePolygonArea(puntos);
        seqSlope = MathEngine.calculateSlopeSequence(puntos);

        // Para escala equivalente
        topoX = MathEngine.round(seqSlope.deltaE || 30);
        topoY = MathEngine.round(seqSlope.deltaN || 20);
    }

    const topoVc = MathEngine.calculateExcavationVolume(topoArea, seqSlope.pendiente);

    // Actualizar Secuencia Matemática en Pantalla
    document.getElementById('seq-deltah').innerText = seqSlope.deltaH.toFixed(2);
    document.getElementById('seq-dh').innerText = seqSlope.dh.toFixed(2);
    document.getElementById('seq-pend').innerText = `${seqSlope.pendiente.toFixed(2)}%`;
    document.getElementById('seq-tipo').innerText = seqSlope.clasificacion;

    document.getElementById('topo-area').innerText = topoArea.toFixed(2);
    document.getElementById('topo-vc').innerText = topoVc.toFixed(2);

    const loteX = parseFloat(document.getElementById('lote-x').value);
    const loteB = parseFloat(document.getElementById('lote-b').value);

    const pisoAltura = parseFloat(document.getElementById('piso-altura').value);
    const horaSol = parseFloat(document.getElementById('hora-sol').value);

    const costoM2 = parseFloat(document.getElementById('costo-m2').value);
    const costoM3 = parseFloat(document.getElementById('costo-m3').value);
    const costoFijo = parseFloat(document.getElementById('costo-fijo').value);

    document.getElementById('lote-x-val').innerText = `${loteX.toFixed(2)} m`;
    document.getElementById('lote-b-val').innerText = `${loteB.toFixed(2)} m`;
    document.getElementById('hora-sol-val').innerText = `${Math.floor(horaSol)}:${(horaSol % 1 * 60).toString().padStart(2, '0')} hrs`;

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
    if (numPuntos === 0) {
        document.getElementById('sum-vertices').innerText = `(0,0), (${topoX},0), (${topoX},${topoY}), (0,${topoY})`;
    } else {
        document.getElementById('sum-vertices').innerText = `${numPuntos} Puntos Poligonales (${topoArea.toFixed(2)} m²)`;
    }
    document.getElementById('sum-pendiente').innerText = `${seqSlope.pendiente.toFixed(2)}% (${seqSlope.clasificacion})`;
    document.getElementById('sum-vc').innerText = `${topoVc.toFixed(2)} m³`;
    document.getElementById('sum-b').innerText = loteB;
    document.getElementById('sum-dims').innerText = `${loteX.toFixed(2)} m × ${loteYCalc.toFixed(2)} m`;
    document.getElementById('sum-xv').innerText = `${vertex.xv.toFixed(2)} m (Amax = ${vertex.amax.toFixed(2)} m²)`;
    document.getElementById('sum-pisos').innerText = `${numFloors} Piso(s) (${alturaTotal.toFixed(2)} m)`;
    document.getElementById('sum-presupuesto').innerText = `$${costos.total.toLocaleString('es-CO')}`;

    app3d.renderTerrain(topoX, topoY, seqSlope.pendiente);
    app3d.renderPoligonalPuntos(numPuntos === 0 ? [] : puntos, topoX, topoY);

    if (currentStep >= 3) {
        app3d.renderBuilding(loteX, loteYCalc, pisoAltura, numFloors);
    } else {
        app3d.renderBuilding(loteX, loteYCalc, pisoAltura, 0);
    }

    app3d.updateSunPosition(horaSol);
    updateChart2D(currentStep, numPuntos, puntos, topoX, topoY, loteB, loteX);
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
                    title: { display: true, text: 'Coordenada Este / Dimensión X (m)', color: '#94a3b8' },
                    grid: { color: '#334155' },
                    ticks: { color: '#f8fafc' }
                },
                y: {
                    title: { display: true, text: 'Coordenada Norte / Área (m²)', color: '#94a3b8' },
                    grid: { color: '#334155' },
                    ticks: { color: '#f8fafc' }
                }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });
}

function updateChart2D(step, numPuntos, puntos, topoX, topoY, b, xActual) {
    if (step === 1) {
        document.getElementById('chart-title').innerText = 'Plano Cartesiano Topográfico - Poligonal Unida (2D)';
        
        let datasetData = [];
        if (numPuntos === 0 || puntos.length < 3) {
            datasetData = [
                { x: 0, y: 0 },
                { x: topoX, y: 0 },
                { x: topoX, y: topoY },
                { x: 0, y: topoY },
                { x: 0, y: 0 }
            ];
        } else {
            datasetData = puntos.map(p => ({ x: p.E, y: p.N }));
            datasetData.push({ x: puntos[0].E, y: puntos[0].N }); // Unir con el primer punto
        }

        chart2d.data.datasets = [{
            label: numPuntos === 0 ? 'Poligonal Rectangular' : `Poligonal (${numPuntos} Vértices Unid.)`,
            data: datasetData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.25)',
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
