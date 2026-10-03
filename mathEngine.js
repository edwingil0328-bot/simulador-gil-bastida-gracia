class MathEngine {
    static round(val, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round((val + Number.EPSILON) * factor) / factor;
    }

    static calculateArea(x, b) {
        const area = -Math.pow(x, 2) + (b * x);
        return this.round(Math.max(0, area));
    }

    static calculateVertex(b) {
        const xv = b / 2;
        const amax = Math.pow(b, 2) / 4;
        return {
            xv: this.round(xv),
            amax: this.round(amax)
        };
    }

    static calculateEfficiency(currentArea, maxArea) {
        if (maxArea <= 0) return 0;
        const eff = (currentArea / maxArea) * 100;
        return this.round(Math.min(100, Math.max(0, eff)));
    }

    static calculateExcavationVolume(area, slopePercentage) {
        const depth = (slopePercentage / 100) * 2.0;
        return this.round(area * depth);
    }

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
