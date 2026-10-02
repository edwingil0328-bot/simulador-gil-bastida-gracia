// mathEngine.js

/**
 * Motor Matemático y Computacional para Análisis Topográfico y Costos
I */
class MathEngine {
    /**
     * Redondeo numérico flotante IEEE 754 a 2 decimales exactos.
     * @param {number} value 
     * @returns {number}
     */
    static round2(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    /**
     * Calcula el área mediante la función cuadrática A(x) = -x² + b·x
     * @param {number} x - Dimensión evaluada
     * @param {number} b - Parámetro de contorno
     * @returns {number}
     */
    static calculateArea(x, b) {
        const area = -Math.pow(x, 2) + (b * x);
        return this.round2(Math.max(0, area));
    }

    /**
     * Calcula el vértice de la parábola cuadrática: x_v = b / 2, A_max = A(x_v)
     * @param {number} b 
     * @returns {{ xVertex: number, maxArea: number }}
     */
    static calculateVertex(b) {
        const xVertex = b / 2;
        const maxArea = this.calculateArea(xVertex, b);
        return {
            xVertex: this.round2(xVertex),
            maxArea: this.round2(maxArea)
        };
    }

    /**
     * Ecuación lineal de costos: C(A) = (A * Valor_M2) + (V_corte * Valor_M3) + Costos_Fijos
     * @param {number} area 
     * @param {number} cutVolume 
     * @param {number} valM2 
     * @param {number} valM3 
     * @param {number} fixedCosts 
     * @returns {number}
     */
    static calculateTotalCost(area, cutVolume, valM2, valM3, fixedCosts) {
        const cost = (area * valM2) + (cutVolume * valM3) + fixedCosts;
        return this.round2(cost);
    }
}

/**
 * Controlador de Interfaz y Enlace con el Motor Matemático
 */
document.addEventListener('DOMContentLoaded', () => {
    const inputs = {
        x: document.getElementById('input-x'),
        b: document.getElementById('input-b'),
        elevation: document.getElementById('input-elevation'),
        cutVolume: document.getElementById('input-cut-volume'),
        valM2: document.getElementById('input-val-m2'),
        valM3: document.getElementById('input-val-m3'),
        fixedCosts: document.getElementById('input-fixed-costs')
    };

    const outputs = {
        area: document.getElementById('display-area'),
        maxArea: document.getElementById('display-max-area'),
        elevation: document.getElementById('display-elevation'),
        volume: document.getElementById('display-volume'),
        cost: document.getElementById('display-cost')
    };

    function updateSimulation() {
        const x = parseFloat(inputs.x.value) || 0;
        const b = parseFloat(inputs.b.value) || 0;
        const elevation = parseFloat(inputs.elevation.value) || 0;
        const cutVolume = parseFloat(inputs.cutVolume.value) || 0;
        const valM2 = parseFloat(inputs.valM2.value) || 0;
        const valM3 = parseFloat(inputs.valM3.value) || 0;
        const fixedCosts = parseFloat(inputs.fixedCosts.value) || 0;

        // Cálculos mediante el motor matemático
        const area = MathEngine.calculateArea(x, b);
        const { maxArea } = MathEngine.calculateVertex(b);
        const totalCost = MathEngine.calculateTotalCost(area, cutVolume, valM2, valM3, fixedCosts);

        // Renderizado en DOM con formato exacto
        outputs.area.textContent = area.toFixed(2);
        outputs.maxArea.textContent = maxArea.toFixed(2);
        outputs.elevation.textContent = MathEngine.round2(elevation).toFixed(2);
        outputs.volume.textContent = MathEngine.round2(cutVolume).toFixed(2);
        outputs.cost.textContent = totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Event Listeners para reactividad dinámica
    Object.values(inputs).forEach(input => {y
        input.addEventListener('input', updateSimulation);
    });

    // Inicialización del simulador
    updateSimulation();
});