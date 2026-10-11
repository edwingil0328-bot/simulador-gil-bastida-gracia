class App3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);

        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(45, 35, 55);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.setupLights();

        this.terrainGroup = new THREE.Group();
        this.cartesianGroup = new THREE.Group();
        this.buildingGroup = new THREE.Group();
        this.vegetationGroup = new THREE.Group();

        this.scene.add(this.terrainGroup);
        this.scene.add(this.cartesianGroup);
        this.scene.add(this.buildingGroup);
        this.scene.add(this.vegetationGroup);

        window.addEventListener('resize', () => this.onWindowResize());
        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.25);
        this.sunLight.position.set(30, 40, 20);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.scene.add(this.sunLight);
    }

    renderTerrain(widthX, lengthY, slope) {
        while(this.terrainGroup.children.length > 0) { 
            this.terrainGroup.remove(this.terrainGroup.children[0]); 
        }
        while(this.vegetationGroup.children.length > 0) {
            this.vegetationGroup.remove(this.vegetationGroup.children[0]);
        }

        const geom = new THREE.PlaneGeometry(widthX + 35, lengthY + 35, 20, 20);
        geom.rotateX(-Math.PI / 2);

        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const z = pos.getZ(i);
            pos.setY(i, (z / 10) * (slope / 10));
        }
        geom.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            wireframe: false,
            roughness: 0.8
        });

        const terrainMesh = new THREE.Mesh(geom, mat);
        terrainMesh.receiveShadow = true;
        this.terrainGroup.add(terrainMesh);

        const grid = new THREE.GridHelper(Math.max(widthX, lengthY) + 40, 20, 0x38bdf8, 0x334155);
        grid.position.y = 0.05;
        this.terrainGroup.add(grid);

        // Árboles y vegetación circundante en el terreno
        this.renderTrees(widthX, lengthY);
    }

    renderTrees(widthX, lengthY) {
        const halfX = widthX / 2 + 8;
        const halfY = lengthY / 2 + 8;

        const treeCoords = [
            { x: -halfX - 4, z: -halfY - 4 },
            { x: halfX + 5, z: -halfY - 2 },
            { x: -halfX - 2, z: halfY + 6 },
            { x: halfX + 4, z: halfY + 4 },
            { x: 0, z: -halfY - 8 },
            { x: 0, z: halfY + 8 },
            { x: -halfX - 8, z: 0 },
            { x: halfX + 8, z: 0 }
        ];

        treeCoords.forEach(pos => {
            const tree = this.createTree(pos.x, pos.z);
            this.vegetationGroup.add(tree);
        });
    }

    createTree(x, z) {
        const treeGroup = new THREE.Group();
        
        // Tronco de madera
        const trunkGeom = new THREE.CylinderGeometry(0.25, 0.4, 2.2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 1.1;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Copa de árbol (dos conos superpuestos)
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
        
        const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.8, 8), foliageMat);
        foliage1.position.y = 3.0;
        foliage1.castShadow = true;
        treeGroup.add(foliage1);

        const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 8), foliageMat);
        foliage2.position.y = 4.2;
        foliage2.castShadow = true;
        treeGroup.add(foliage2);

        treeGroup.position.set(x, 0.1, z);
        return treeGroup;
    }

    renderPoligonalPuntos(puntos, widthX, lengthY) {
        while(this.cartesianGroup.children.length > 0) {
            this.cartesianGroup.remove(this.cartesianGroup.children[0]);
        }

        let threePoints = [];

        if (!puntos || puntos.length < 3) {
            threePoints = [
                new THREE.Vector3(-widthX/2, 0.2, -lengthY/2),
                new THREE.Vector3(widthX/2, 0.2, -lengthY/2),
                new THREE.Vector3(widthX/2, 0.2, lengthY/2),
                new THREE.Vector3(-widthX/2, 0.2, lengthY/2),
                new THREE.Vector3(-widthX/2, 0.2, -lengthY/2)
            ];
        } else {
            const minE = Math.min(...puntos.map(p => p.E));
            const maxE = Math.max(...puntos.map(p => p.E));
            const minN = Math.min(...puntos.map(p => p.N));
            const maxN = Math.max(...puntos.map(p => p.N));

            const centerE = (minE + maxE) / 2;
            const centerN = (minN + maxN) / 2;

            puntos.forEach(p => {
                const x3d = (p.E - centerE);
                const z3d = (p.N - centerN);
                const y3d = 0.2;
                threePoints.push(new THREE.Vector3(x3d, y3d, z3d));
            });
            threePoints.push(threePoints[0].clone());
        }

        const lineGeom = new THREE.BufferGeometry().setFromPoints(threePoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 });
        const line = new THREE.Line(lineGeom, lineMat);
        this.cartesianGroup.add(line);

        threePoints.slice(0, threePoints.length - 1).forEach((p) => {
            const sphereGeom = new THREE.SphereGeometry(0.7, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
            const sphere = new THREE.Mesh(sphereGeom, sphereMat);
            sphere.position.copy(p);
            this.cartesianGroup.add(sphere);
        });
    }

    renderBuilding(widthX, lengthY, floorHeight, numFloors) {
        while(this.buildingGroup.children.length > 0) {
            this.buildingGroup.remove(this.buildingGroup.children[0]);
        }

        if (numFloors <= 0) return;

        // Materiales de alta fidelidad arquitectónica
        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0, // Concreto estructural blanco/gris
            roughness: 0.6,
            metalness: 0.1
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8, // Cristal reflectante azul
            transparent: true,
            opacity: 0.55,
            roughness: 0.1,
            metalness: 0.8
        });

        const mullionMat = new THREE.MeshStandardMaterial({
            color: 0x334155, // Perfiles de aluminio gris oscuro
            roughness: 0.3,
            metalness: 0.8
        });

        const slabThickness = 0.22;
        const windowHeight = Math.max(0.1, floorHeight - slabThickness);

        for (let i = 0; i < numFloors; i++) {
            const floorBaseY = i * floorHeight;

            // 1. Losa de Entrepiso (Piso del nivel) - Concreto
            const slabGeom = new THREE.BoxGeometry(widthX, slabThickness, lengthY);
            const slab = new THREE.Mesh(slabGeom, concreteMat);
            slab.position.set(0, floorBaseY + (slabThickness / 2) + 0.05, 0);
            slab.castShadow = true;
            slab.receiveShadow = true;
            this.buildingGroup.add(slab);

            const slabEdges = new THREE.EdgesGeometry(slabGeom);
            const slabWire = new THREE.LineSegments(slabEdges, new THREE.LineBasicMaterial({ color: 0x94a3b8 }));
            slabWire.position.copy(slab.position);
            this.buildingGroup.add(slabWire);

            // 2. Muro Cortina de Vidrio (Ventanales habitables)
            const windowCenterY = floorBaseY + slabThickness + (windowHeight / 2) + 0.05;
            const glassGeom = new THREE.BoxGeometry(widthX * 0.98, windowHeight, lengthY * 0.98);
            const glassBox = new THREE.Mesh(glassGeom, glassMat);
            glassBox.position.set(0, windowCenterY, 0);
            this.buildingGroup.add(glassBox);

            // 3. Perfiles de Perímetro / Marcos
            const windowEdges = new THREE.EdgesGeometry(glassGeom);
            const windowWire = new THREE.LineSegments(windowEdges, new THREE.LineBasicMaterial({ color: 0x0284c7 }));
            windowWire.position.copy(glassBox.position);
            this.buildingGroup.add(windowWire);

            // 4. Parantes verticales de aluminio (Mullions de fachada)
            const mullionCountX = Math.max(1, Math.floor(widthX / 4));
            for (let m = 1; m < mullionCountX; m++) {
                const posX = -widthX/2 + (widthX / mullionCountX) * m;
                const mullionGeom = new THREE.BoxGeometry(0.1, windowHeight, lengthY * 0.99);
                const mullion = new THREE.Mesh(mullionGeom, mullionMat);
                mullion.position.set(posX, windowCenterY, 0);
                this.buildingGroup.add(mullion);
            }
        }

        // 5. Losa de Cubierta / Techo Final de Concreto
        const roofBaseY = numFloors * floorHeight;
        const roofGeom = new THREE.BoxGeometry(widthX * 1.02, slabThickness * 1.2, lengthY * 1.02);
        const roofSlab = new THREE.Mesh(roofGeom, concreteMat);
        roofSlab.position.set(0, roofBaseY + (slabThickness / 2) + 0.05, 0);
        roofSlab.castShadow = true;
        roofSlab.receiveShadow = true;
        this.buildingGroup.add(roofSlab);

        const roofEdges = new THREE.EdgesGeometry(roofGeom);
        const roofWire = new THREE.LineSegments(roofEdges, new THREE.LineBasicMaterial({ color: 0x64748b }));
        roofWire.position.copy(roofSlab.position);
        this.buildingGroup.add(roofWire);
    }

    updateSunPosition(hour) {
        const angle = ((hour - 6) / 12) * Math.PI;
        const posX = 50 * Math.cos(angle);
        const posY = 50 * Math.sin(angle);

        this.sunLight.position.set(posX, Math.max(2, posY), 20);
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
