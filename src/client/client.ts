
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { 
    Engine, 
    Scene,
    Vector3, 
    HemisphericLight,
    Color3,
    Color4,
    MeshBuilder,
    Space,
    StandardMaterial,
    Texture
} from "@babylonjs/core";

import { FlowerGenome, FlowerInstance } from '../common/flowerInstance';
import { Flower } from "./flower";
import { Terrain } from "./terrain";
import { Player } from "./player";

import io from 'socket.io-client'

import { QuadTree, Box, Point, Circle} from 'js-quadtree';

class App {

    player: Player;
    serverParameters: any;

    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        document.body.style.margin = "0";
        document.body.style.bottom = "100%";
        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);
        scene.gravity = new Vector3(0, -0.15, 0);
        scene.collisionsEnabled = true;
        scene.clearColor = new Color4(0.75, 0.85, 1.0, 1.0);
        scene.fogMode = Scene.FOGMODE_EXP;
        scene.fogDensity = 0.01;
        scene.fogStart = 80.0;
        scene.fogEnd = 100.0;
        scene.fogColor = new Color3(0.75, 0.85, 1.0);

        var skyplane = MeshBuilder.CreateTiledPlane(
            "skyplane",
            {
                size: 1000,
                tileSize: 100,
                sideOrientation: 1
            },
            scene
        );
        skyplane.rotate(Vector3.Right(), Math.PI / 2, Space.WORLD);
        let skymaterial = new StandardMaterial("skyplane-material", scene);
        let skytex = new Texture(
            "./res/tex/hyakuman-clouds_diffuse.png", 
            scene, 
            true, 
            false, 
            Texture.NEAREST_SAMPLINGMODE
        );
        
        skytex.hasAlpha = true;
        skytex.anisotropicFilteringLevel = 1;
        skymaterial.diffuseTexture = skytex;
        skymaterial.emissiveColor = Color3.White();
        skymaterial.useAlphaFromDiffuseTexture = true;
        //skymaterial.alphaMode = Engine.ALPHA_SCREENMODE;
        skyplane.material = skymaterial;

        this.player = new Player("Camera", new Vector3(0, 17.0, -5.0), scene);
        this.player.camera.attachControl(canvas, true);

        scene.registerBeforeRender(()=>{
            skyplane.setAbsolutePosition(this.player.camera.globalPosition);
            skyplane.translate(Vector3.Up(), 40, Space.WORLD);
            skytex.uOffset += 0.00004*scene.getEngine().getDeltaTime();
            skytex.vOffset += 0.00001*scene.getEngine().getDeltaTime();
        });

        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        // make the terrain
        let terrain = new Terrain(scene);

        // connect to the server
        const socket = io("http://127.0.0.1:3000");

        socket.on('connect', () => {
            socket.emit("positionUpdate", {x:0, y:0});
        });

        // quadtree to keep the flower ids in
        // TODO: maybe store mesh references instead of ids for faster removal?
        var quadtree = new QuadTree(new Box(-500, -500, 1000, 1000));

        var updatePlayerPosition = () => {
            let playerX = this.player.latestPositionUpdate.x;
            let playerY = this.player.latestPositionUpdate.z; // x,y position on terrain uses z
            socket.emit("positionUpdate", {x:playerX, y:playerY});

            // remove all flowers loaded but no longer in range from scene
            let allFlowers = quadtree.getAllPoints();
            let flowersInRange = quadtree.query(new Circle(playerX, playerY, this.serverParameters.flowerRange));
            let flowersNotInRange = allFlowers.filter( flower => !flowersInRange.includes(flower) );
            quadtree.remove(flowersNotInRange);
            flowersNotInRange.forEach( flower => {
                let flowerMesh = scene.getMeshByName(flower.data);
                if (flowerMesh) {
                    flowerMesh.dispose();
                } else {
                    console.log("Flower", flower.data, "not found");
                }
            })
        }

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();

            // TODO: unload flowers out of range so we don't have memory leak
            if (this.player.movedPastThreshold()) {
                updatePlayerPosition();
            }
        });

        // update server parameters
        // TODO: initialize or something
        socket.on('config', (data: any) => {
            this.serverParameters = data;
        });
        // load flowers from server
        socket.on('isFlowerLoaded', (flowerID: string) => {
            if (scene.getMeshByName(flowerID) == null) {
                socket.emit('requestFlower', flowerID);
            }
        });
        // create new instances for each flower
        socket.on('sendFlower', (flower: any) => {
            let newFlower = new Flower(flower, scene);
            let newPoint = new Point(flower.location.x, flower.location.y, flower.id);
            quadtree.insert(newPoint);
            newFlower.mesh.metadata = newPoint;
        });
        // remove flowers if the server tells us to
        socket.on('deleteFlower', (flowerID: string) => {
            let flowerToDelete = scene.getMeshByName(flowerID);
            quadtree.remove(flowerToDelete.metadata);
            flowerToDelete.dispose();
        });
        // if the server generates new flowers in range, add them
        socket.on('newFlower', (flower: any) => {
            if (this.player.isPointWithinRange(
                    flower.location.x, 
                    flower.location.y, 
                    this.serverParameters.flowerRange)) {
                let newFlower = new Flower(flower, scene);
                let newPoint = new Point(flower.location.x, flower.location.y, flower.id);
                quadtree.insert(newPoint);
                newFlower.mesh.metadata = newPoint;
            }
        });

        // let player create flowers
        window.addEventListener("click", (event) => {
            let pickResult = scene.pick(event.clientX, event.clientY);
            if (pickResult.hit && pickResult.pickedMesh.name == 'terrain') {
                let newFlower = Flower.createNewInstance(new FlowerGenome(), pickResult.pickedPoint, scene);
                socket.emit('plantFlower', newFlower.instance);
                let newPoint = new Point(
                    newFlower.instance.location.x, 
                    newFlower.instance.location.y, 
                    newFlower.instance.id);
                newFlower.mesh.metadata = newPoint;
                quadtree.insert(newPoint);
            }
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            engine.resize();
        });
    }
}
new App();
