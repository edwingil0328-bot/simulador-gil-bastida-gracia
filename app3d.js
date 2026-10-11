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

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.65,
            roughness: 0.1,
            metalness: 0.6
        });

        const frameMat = new THREE.LineBasicMaterial({ color: 0x0284c7 });

        for (let i = 0; i < numFloors; i++) {
            const yPos = (i * floorHeight) + (floorHeight / 2) + 0.1;

            // Cuerpo del nivel / Losa principal
            const slabGeom = new THREE.BoxGeometry(widthX, floorHeight * 0.92, lengthY);
            const slabMat = new THREE.MeshStandardMaterial({
                color: 0x0284c7,
                transparent: true,
                opacity: 0.85,
                roughness: 0.3
            });

            const slab = new THREE.Mesh(slabGeom, slabMat);
            slab.position.set(0, yPos, 0);
            slab.castShadow = true;
            slab.receiveShadow = true;
            this.buildingGroup.add(slab);

            // Borde estructural/Líneas arquitectónicas
            const edges = new THREE.EdgesGeometry(slabGeom);
            const wireframe = new THREE.LineSegments(edges, frameMat);
            wireframe.position.set(0, yPos, 0);
            this.buildingGroup.add(wireframe);

            // Ventanales predeterminados de cristal por fachada
            const winMargin = 0.05;
            const glassBoxGeom = new THREE.BoxGeometry(widthX + winMargin, floorHeight * 0.6, lengthY + winMargin);
            const glassBox = new THREE.Mesh(glassBoxGeom, glassMat);
            glassBox.position.set(0, yPos, 0);
            this.buildingGroup.add(glassBox);
        }
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
