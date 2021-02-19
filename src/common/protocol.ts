
// client sends to server periodically
export type message_player_update = {
    current_location: {x:number, y:number},
    current_radius: number,
    previous_location: {x:number, y:number},
    previous_radius: number,
    // time by server clock of last update received
    last_update_time: number, 
    // should we get all flowers at new_location?
    full_update: boolean
} // server responds with full message_server_update

// server sends to client when update requested
export type message_server_update = {
    new_flowers: Array<{id:string, mesh:any}>,
    expired_flower_ids: Array<string>,
    // where did we think the client was when this update was prepared
    player_location: {x:number, y:number},
    update_time: number
} // client saves player_location and update_time for new updates

// client sends to server when flower is picked
export type message_picked_flower = {
    pick_id: string
} // server responds with message_flower_genome

// server sends the client a copy of the picked flower genome
export type message_flower_genome = {
    pick_id: string,
    genome: any
} // client stores genome and enables planting

// client sends to server when flower is planted
export type message_planted_flower = {
    new_id: string,
    genome: any,
    player_location: {x:number, y:number}
} // server responds with small message_server_update