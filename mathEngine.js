/**
 * Motor de Cálculo Matemático y Topográfico
 * Álgebra y Geometría Analítica
 */
class MathEngine {
    
    // Redondeo decimal preciso
    static round(val, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round((val + Number.EPSILON) * factor) / factor;
    }

    // Ecuación Cuadrática del Área del Lote: A(x) = -x² + b·x
    static calculateArea(x, b) {
        const area = -Math.pow(x, 2) + (b * x);
        return this.round(Math.max(0, area));
    }

    // Cálculo del Vértice de Área Máxima: xv = b / 2, Amax = (b^2) / 4
    static calculateVertex(b) {
        const xv = b / 2;
        const amax = Math.pow(b, 2) / 4;
        return {
            xv: this.round(xv),
            amax: this.round(amax)
        };
    }

    // Porcentaje de Eficiencia del Lote
    static calculateEfficiency(currentArea, maxArea) {
        if (maxArea <= 0) return 0;
        const eff = (currentArea / maxArea) * 100;
        return this.round(Math.min(100, Math.max(0, eff)));
    }

    // Volumen de Excavación Topográfica Vc (m³)
    static calculateExcavationVolume(area, slopePercentage) {
        // Vc proporcional al área y la pendiente del terreno
        const depth = (slopePercentage / 100) * 2.0; // Profundidad equivalente
        return this.round(area * depth);
    }

    // Ecuación Lineal de Costos: C(A) = (A * C_m2) + (Vc * C_m3) + C_fijo
    static calculateTotalCost(areaConstruida, costoM2, volumeCut, costoM3, costosFijos) {
        const costoConstruccion = areaConstruida * costoM2;
        const costoCorte = volumeCut * costoM3;
        const total = costoConstruccion + costoCorte + costosFijos;

        return {
            costoConstruccion: this.round(costoConstruccion),
            costoCorte: this.round(costoCorte),
            total: this.round(total)
        };
    }
}
