/**
 * app3d.js - Fase 2: Visualización Topográfica y Edificación Dinámica
 * Dependencias: Three.js, OrbitControls (vía CDN)
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';

class UrbanSimulator3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
        this.createTerrain();
        this.createPlotAndBuilding();
        this.setupLights();
        this.animate();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }

    init() {
        // Escena y Cámara
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e17);

        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(20, 20, 20);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controles
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
    }

    createTerrain() {
        const segments = 64;
        const geometry = new THREE.PlaneGeometry(40, 40, segments, segments);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x2e3d52, 
            wireframe: false, 
            flatShading: false,
            side: THREE.DoubleSide 
        });

        // Modificación de vértices (Simulación de relieve decimal)
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            // Función matemática de relieve: z = sin(x/4) * cos(y/4) * 2
            positions[i + 2] = Math.sin(x / 4) * Math.cos(y / 4) * 2.5;
        }
        geometry.computeVertexNormals();

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2; // Orientar plano horizontalmente
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
    }

    createPlotAndBuilding() {
        // Lote (Plano sobre terreno)
        const plotGeo = new THREE.PlaneGeometry(10, 10);
        const plotMat = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.3 });
        this.plot = new THREE.Mesh(plotGeo, plotMat);
        this.plot.rotation.x = -Math.PI / 2;
        this.plot.position.y = 2.6; // Ajuste según elevación máx del terreno
        this.scene.add(this.plot);

        // Edificación (Prisma Dinámico)
        const buildGeo = new THREE.BoxGeometry(1, 1, 1);
        const buildMat = new THREE.MeshStandardMaterial({ color: 0xdeff9a });
        this.building = new THREE.Mesh(buildGeo, buildMat);
        this.building.castShadow = true;
        this.building.position.y = 3.5; 
        this.scene.add(this.building);
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // Luz Solar (Direccional con sombras)
        this.sun = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sun.position.set(10, 20, 10);
        this.sun.castShadow = true;
        
        // Ajuste de cámara de sombras para el terreno
        this.sun.shadow.camera.left = -20;
        this.sun.shadow.camera.right = 20;
        this.sun.shadow.camera.top = 20;
        this.sun.shadow.camera.bottom = -20;
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;

        this.scene.add(this.sun);
    }

    // Método dinámico para actualizar dimensiones desde el motor JS
    updateBuilding(width, depth, height) {
        this.building.scale.set(width, height, depth);
        this.building.position.y = 2.6 + (height / 2);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        
        // Simulación de rotación solar suave
        const time = Date.now() * 0.0005;
        this.sun.position.x = Math.cos(time) * 20;
        this.sun.position.z = Math.sin(time) * 20;

        this.renderer.render(this.scene, this.camera);
    }
}

// Inicialización
const app3d = new UrbanSimulator3D('canvas-container');