
/* COMMUNICATION PROTOCOL
** 
** Establish connection with socket: server emits 'connect' with no data
** client receives 'connect' and sends 'init'
** server receives 'init' message and sends 'config' -> serverParameters
**
** client sends 'positionUpdate' when ready (terrain loaded) -> {position, loadedFlowerNames}
** server responds with:
** 'addFlowers' -> [flowerInstancesToAdd]
** 'deleteFlowers' -> {flowerNamesToRemove}
**
** Server periodically generates and removes flowers, this follows
** the same protocol for 'addFlowers' and 'deleteFlowers'
**
** Client may plant flowers. Server receives 'plantFlower' -> flowerInstance
** Server sends 'addFlowers' and 'deleteFlowers' as appropriate (maybe client loads temp flower?)
*/

export type PositionUpdate = {
    position: {x: number, y: number},
    loadedFlowerIDs: Array<string>
}

export type ServerParameters = {
    flowerRange: number, // range at which a player will load/unload flowers from the server
    flowerExclusionRange: number, // how close can two flowers get to each other?
    flowerSpreadInterval: number, // how often (in ms) will flowers update?
    flowerSpreadFraction: number, // what fraction of flowers will likely update?
    maxFlowerUpdates: number // what is the max number of flowers that will update each interval?
}