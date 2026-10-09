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

    // Algoritmo de Gauss / Shoelace para área de polígono por coordenadas (E, N)
    static calculatePolygonArea(points) {
        if (!points || points.length < 3) return 0;
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].E * points[j].N;
            area -= points[j].E * points[i].N;
        }
        return this.round(Math.abs(area) / 2.0);
    }

    // Secuencia matemática directa para el cálculo de la pendiente (%)
    static calculateSlopeSequence(points, manualSlope = null, manualDeltaH = null) {
        if (!points || points.length === 0) {
            const pend = manualSlope !== null ? manualSlope : 5.0;
            return {
                deltaH: manualDeltaH || 1.50,
                dh: 30.00,
                pendiente: this.round(pend),
                clasificacion: pend < 5 ? "Plano" : (pend <= 15 ? "Moderado" : "Empinado")
            };
        }

        const zValues = points.map(p => p.Z !== undefined ? p.Z : 2500);
        const zMax = Math.max(...zValues);
        const zMin = Math.min(...zValues);
        let deltaH = this.round(zMax - zMin);
        if (deltaH === 0) deltaH = manualDeltaH || 1.50;

        const eValues = points.map(p => p.E);
        const nValues = points.map(p => p.N);
        const eMin = Math.min(...eValues);
        const eMax = Math.max(...eValues);
        const nMin = Math.min(...nValues);
        const nMax = Math.max(...nValues);

        const deltaE = eMax - eMin;
        const deltaN = nMax - nMin;
        let dh = this.round(Math.sqrt(Math.pow(deltaE, 2) + Math.pow(deltaN, 2)));
        if (dh === 0) dh = 30.00;

        const pendiente = this.round((deltaH / dh) * 100);
        const clasificacion = pendiente < 5 ? "Plano" : (pendiente <= 15 ? "Moderado" : "Empinado");

        return {
            zMax: this.round(zMax),
            zMin: this.round(zMin),
            deltaH: deltaH,
            eMin: this.round(eMin),
            eMax: this.round(eMax),
            nMin: this.round(nMin),
            nMax: this.round(nMax),
            deltaE: this.round(deltaE),
            deltaN: this.round(deltaN),
            dh: dh,
            pendiente: pendiente,
            clasificacion: clasificacion
        };
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
