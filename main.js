/**
 * main.js - Orquestador Principal, Visualizador 2D y Eventos en Tiempo Real
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';

/* ==========================================================================
   1. MOTOR MATEMÁTICO (MathEngine)
   ========================================================================== */
class MathEngine {
    static round2(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    static calculateArea(x, b) {
        const area = -Math.pow(x, 2) + (b * x);
        return this.round2(Math.max(0, area));
    }

    static calculateVertex(b) {
        const xVertex = b / 2;
        const maxArea = this.calculateArea(xVertex, b);
        return {
            xVertex: this.round2(xVertex),
            maxArea: this.round2(maxArea)
        };
    }

    static calculateTotalCost(area, cutVolume, valM2, valM3, fixedCosts) {
        const cost = (area * valM2) + (cutVolume * valM3) + fixedCosts;
        return this.round2(cost);
    }
}

/* ==========================================================================
   2. MOTOR DE VISUALIZACIÓN 3D (Three.js)
   ========================================================================== */
class UrbanSimulator3D {
    constructor(container) {
        this.container = container;
        this.init();
        this.createTerrain();
        this.createPlotAndBuilding();
        this.setupLights();
        this.animate();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e17);

        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(25, 25, 25);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
    }

    createTerrain() {
        const segments = 64;
        const geometry = new THREE.PlaneGeometry(50, 50, segments, segments);
        const material = new THREE.MeshPhongMaterial({ color: 0x1d293d, side: THREE.DoubleSide, flatShading: true });

        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            positions[i + 2] = Math.sin(x / 5) * Math.cos(y / 5) * 2;
        }
        geometry.computeVertexNormals();

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
    }

    createPlotAndBuilding() {
        const plotGeo = new THREE.PlaneGeometry(1, 1);
        const plotMat = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
        this.plot = new THREE.Mesh(plotGeo, plotMat);
        this.plot.rotation.x = -Math.PI / 2;
        this.plot.position.y = 2.05;
        this.scene.add(this.plot);

        const buildGeo = new THREE.BoxGeometry(1, 1, 1);
        const buildMat = new THREE.MeshStandardMaterial({ color: 0x00e676, roughness: 0.3 });
        this.building = new THREE.Mesh(buildGeo, buildMat);
        this.building.castShadow = true;
        this.building.receiveShadow = true;
        this.scene.add(this.building);
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        this.scene.add(ambient);

        this.sun = new THREE.DirectionalLight(0xffffff, 1.3);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.camera.left = -30;
        this.sun.shadow.camera.right = 30;
        this.sun.shadow.camera.top = 30;
        this.sun.shadow.camera.bottom = -30;
        this.scene.add(this.sun);
    }

    updateBuildingGeometry(widthX, area, floorHeight, floors) {
        const depthY = widthX > 0 ? area / widthX : 0;
        const totalHeight = floorHeight * floors;

        // Actualizar Lote
        this.plot.scale.set(widthX, depthY, 1);

        // Actualizar Prisma
        this.building.scale.set(widthX, totalHeight, depthY);
        this.building.position.y = 2.0 + (totalHeight / 2);
    }

    updateSunPosition(hour) {
        // Mapeo horario (06:00 a 18:00) a trayectoria arco (0 a PI)
        const rad = ((hour - 6) / 12) * Math.PI;
        const distance = 40;
        this.sun.position.x = -Math.cos(rad) * distance;
        this.sun.position.y = Math.sin(rad) * distance;
        this.sun.position.z = 10;
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

/* ==========================================================================
   3. DASHBOARD 2D (Renderizado de Parábola Canvas)
   ========================================================================== */
class ParabolaChart2D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    render(xCurrent, bParam) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;
        const padding = 25;

        ctx.clearRect(0, 0, w, h);

        const xMaxDomain = bParam;
        const yMaxDomain = Math.pow(bParam / 2, 2);

        // Mapeo de coordenadas mundo 2D a píxeles
        const toScreenX = (x) => padding + (x / xMaxDomain) * (w - 2 * padding);
        const toScreenY = (y) => (h - padding) - (y / (yMaxDomain || 1)) * (h - 2 * padding);

        // Dibujar Ejes
        ctx.strokeStyle = '#2e3d52';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);
        ctx.lineTo(w - padding, h - padding);
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, h - padding);
        ctx.stroke();

        // Dibujar Parábola
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let px = 0; px <= xMaxDomain; px += xMaxDomain / 100) {
            const py = -Math.pow(px, 2) + (bParam * px);
            const sx = toScreenX(px);
            const sy = toScreenY(py);
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Vértice Área Máxima
        const { xVertex, maxArea } = MathEngine.calculateVertex(bParam);
        const vx = toScreenX(xVertex);
        const vy = toScreenY(maxArea);

        ctx.fillStyle = '#ffb74d';
        ctx.beginPath();
        ctx.arc(vx, vy, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Punto Evalua Actual
        const currentArea = MathEngine.calculateArea(xCurrent, bParam);
        const cx = toScreenX(xCurrent);
        const cy = toScreenY(currentArea);

        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/* ==========================================================================
   4. INICIALIZACIÓN Y EVENTOS REACTIVOS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    const app3D = new UrbanSimulator3D(container);
    const chart2D = new ParabolaChart2D('parabola-canvas');

    // DOM Elements Inputs
    const inputs = {
        x: document.getElementById('input-x'),
        b: document.getElementById('input-b'),
        floorHeight: document.getElementById('input-floor-height'),
        floors: document.getElementById('input-floors'),
        sunTime: document.getElementById('input-sun-time'),
        elevation: document.getElementById('input-elevation'),
        cutVolume: document.getElementById('input-cut-volume'),
        valM2: document.getElementById('input-val-m2'),
        valM3: document.getElementById('input-val-m3'),
        fixedCosts: document.getElementById('input-fixed-costs')
    };

    // DOM Elements Outputs
    const outputs = {
        valX: document.getElementById('val-x'),
        valB: document.getElementById('val-b'),
        valFloorHeight: document.getElementById('val-floor-height'),
        valFloors: document.getElementById('val-floors'),
        valSunTime: document.getElementById('val-sun-time'),
        area: document.getElementById('display-area'),
        maxArea: document.getElementById('display-max-area'),
        elevation: document.getElementById('display-elevation'),
        volume: document.getElementById('display-volume'),
        cost: document.getElementById('display-cost')
    };

    function updateApp() {
        const x = parseFloat(inputs.x.value) || 0;
        const b = parseFloat(inputs.b.value) || 0;
        const floorHeight = parseFloat(inputs.floorHeight.value) || 0;
        const floors = parseInt(inputs.floors.value) || 1;
        const sunTime = parseFloat(inputs.sunTime.value) || 12;
        const elevation = parseFloat(inputs.elevation.value) || 0;
        const cutVolume = parseFloat(inputs.cutVolume.value) || 0;
        const valM2 = parseFloat(inputs.valM2.value) || 0;
        const valM3 = parseFloat(inputs.valM3.value) || 0;
        const fixedCosts = parseFloat(inputs.fixedCosts.value) || 0;

        // Limitar x respecto al valor b
        inputs.x.max = b;

        // Actualizar Labels UI
        outputs.valX.textContent = x.toFixed(2);
        outputs.valB.textContent = b.toFixed(2);
        outputs.valFloorHeight.textContent = floorHeight.toFixed(2);
        outputs.valFloors.textContent = floors;
        
        const hrs = Math.floor(sunTime);
        const mins = Math.round((sunTime - hrs) * 60);
        outputs.valSunTime.textContent = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        // Cálculo Matemático
        const area = MathEngine.calculateArea(x, b);
        const { maxArea } = MathEngine.calculateVertex(b);
        const totalCost = MathEngine.calculateTotalCost(area, cutVolume, valM2, valM3, fixedCosts);

        // Actualización DOM Métricas
        outputs.area.textContent = area.toFixed(2);
        outputs.maxArea.textContent = maxArea.toFixed(2);
        outputs.elevation.textContent = MathEngine.round2(elevation).toFixed(2);
        outputs.volume.textContent = MathEngine.round2(cutVolume).toFixed(2);
        outputs.cost.textContent = totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Sincronización Motor 3D
        app3D.updateBuildingGeometry(x, area, floorHeight, floors);
        app3D.updateSunPosition(sunTime);

        // Renderizado Gráfico 2D
        chart2D.render(x, b);
    }

    // Reactividad en tiempo real (Escuchadores de eventos)
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', updateApp);
    });

    // Render Inicial
    updateApp();
});