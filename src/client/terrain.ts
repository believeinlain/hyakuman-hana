
import { 
    GroundMesh,
    Mesh,
    MeshBuilder,
    Scene,
    PBRMetallicRoughnessMaterial,
    Texture
} from "@babylonjs/core";

export class Terrain {

    ground: Mesh;

    constructor (scene: Scene, onReadyFunction: ()=>void ) {
        let options = {
            width: 1000,
            height: 1000, 
            maxHeight: 20, 
            minHeight: 0, 
            subdivisions: 200,
            updatable: true,
            onReady: () => {
                this.ground.convertToFlatShadedMesh();
                onReadyFunction();
            }
        };
        this.ground = MeshBuilder.CreateGroundFromHeightMap(
            'terrain', 
            "./res/tex/hyakuman-terrain_heightmap.png", 
            options, 
            scene
        );
        
        this.ground.checkCollisions = true;

        var material = new PBRMetallicRoughnessMaterial(name+"-material", scene);
        material.baseTexture = new Texture(
            "./res/tex/hyakuman-terrain_diffuse.png", scene);
        material.metallicRoughnessTexture = new Texture(
            "./res/tex/hyakuman-terrain_metallicRoughness.png", scene);
        this.ground.material = material;
    }
}