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

        this.scene.add(this.terrainGroup);
        this.scene.add(this.cartesianGroup);
        this.scene.add(this.buildingGroup);

        window.addEventListener('resize', () => this.onWindowResize());
        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
        this.sunLight.position.set(30, 40, 20);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.scene.add(this.sunLight);
    }

    renderTerrain(widthX, lengthY, slope) {
        while(this.terrainGroup.children.length > 0) { 
            this.terrainGroup.remove(this.terrainGroup.children); 
        }

        const geom = new THREE.PlaneGeometry(widthX + 20, lengthY + 20, 20, 20);
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

        const grid = new THREE.GridHelper(Math.max(widthX, lengthY) + 30, 20, 0x38bdf8, 0x334155);
        grid.position.y = 0.05;
        this.terrainGroup.add(grid);
    }

    renderPoligonal(widthX, lengthY) {
        while(this.cartesianGroup.children.length > 0) {
            this.cartesianGroup.remove(this.cartesianGroup.children);
        }

        const points = [
            new THREE.Vector3(-widthX/2, 0.2, -lengthY/2),
            new THREE.Vector3(widthX/2, 0.2, -lengthY/2),
            new THREE.Vector3(widthX/2, 0.2, lengthY/2),
            new THREE.Vector3(-widthX/2, 0.2, lengthY/2),
            new THREE.Vector3(-widthX/2, 0.2, -lengthY/2)
        ];

        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 });
        const line = new THREE.Line(lineGeom, lineMat);
        this.cartesianGroup.add(line);

        points.slice(0, 4).forEach((p) => {
            const sphereGeom = new THREE.SphereGeometry(0.6, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
            const sphere = new THREE.Mesh(sphereGeom, sphereMat);
            sphere.position.copy(p);
            this.cartesianGroup.add(sphere);
        });
    }

    renderBuilding(widthX, lengthY, floorHeight, numFloors) {
        while(this.buildingGroup.children.length > 0) {
            this.buildingGroup.remove(this.buildingGroup.children);
        }

        if (numFloors <= 0) return;

        for (let i = 0; i < numFloors; i++) {
            const yPos = (i * floorHeight) + (floorHeight / 2) + 0.1;

            const slabGeom = new THREE.BoxGeometry(widthX, floorHeight * 0.9, lengthY);
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

            const edges = new THREE.EdgesGeometry(slabGeom);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
            const wireframe = new THREE.LineSegments(edges, lineMat);
            wireframe.position.set(0, yPos, 0);
            this.buildingGroup.add(wireframe);
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
