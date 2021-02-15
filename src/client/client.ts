
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
    Texture,
    Vector2
} from "@babylonjs/core";

import { FlowerGenome } from '../common/flowerGenome';
import { FlowerField } from './flowerField';
import { FlowerPacket } from '../common/flowerPacket';
import { PositionUpdate, ServerParameters } from '../common/protocol';
import { Flower } from "./flower";
import { Terrain } from "./terrain";
import { Player } from "./player";

import io from 'socket.io-client'

class App {

    player: Player;
    serverParameters: ServerParameters;
    flowerField: FlowerField;
    socket: SocketIOClient.Socket;

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

        // connect to the server
        this.socket = io("http://127.0.0.1:3000");

        // send initial message on connecting
        this.socket.on('connect', () => {
            console.log("Connected to server");
            this.socket.emit('init');
        });
        // update server parameters
        this.socket.on('config', (data: ServerParameters) => {
            console.log("Received config from server");
            this.serverParameters = data;
        });

        // make the terrain
        new Terrain(scene, ()=>{
            // send position update once terrain is loaded
            console.log("Terrain loaded");
            let positionUpdate: PositionUpdate = {position: {x: 0, y: 0}, loadedFlowerIDs: []}
            this.socket.emit('positionUpdate', positionUpdate);
        });

        // create new instances for each flower if necessary
        this.socket.on('addFlowers', (flowers: FlowerPacket[]) => {
            // add each flower in range of player to the field
            // TODO: figure out what to do if we get flowers without serverParameters
            this.flowerField.addFlowers(flowers);
        });
        // if the server removes flowers, delete them
        this.socket.on('deleteFlowers', (flowerIDs: string[]) => {
            // remove each flower from scene
            this.flowerField.removeFlowers(flowerIDs);
        });
        // let player create flowers
        window.addEventListener("click", (event) => {
            let pickResult = scene.pick(event.clientX, event.clientY);
            if (pickResult.hit) {
                if (pickResult.pickedMesh.name == 'terrain') {
                    let newFlower = this.player.plantFlower(pickResult.pickedPoint);
                    this.socket.emit('plantFlower', newFlower.info);
                    this.flowerField.addFlowers([newFlower.info]);
                } else if (pickResult.pickedMesh.metadata instanceof Flower) {
                    this.player.pickFlower(pickResult.pickedMesh.metadata.info.genome);
                }
            }
        });

        // quadtree to keep the flower ids in
        this.flowerField = new FlowerField(scene);

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();

            // send position updates periodically
            if (this.player.movedPastThreshold()) {
                let positionUpdate: PositionUpdate = {
                    position: {
                        x:this.player.latestPositionUpdate.x, 
                        y:this.player.latestPositionUpdate.z // x,y position on terrain uses z
                    },
                    loadedFlowerIDs: this.flowerField.getAllFlowerIDs()
                };
                this.socket.emit('positionUpdate', positionUpdate);
            }
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            engine.resize();
        });
    }
}
new App();
