console.info("[Brink Logistics] 08_admin_commands.js ACTIVE")

var BA_StringArgumentType = Java.loadClass("com.mojang.brigadier.arguments.StringArgumentType")

function BA_targetBlock(player) {
    let hit = player.rayTrace(8)
    if (!hit || !hit.block) return null
    return hit.block
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    event.register(
        Commands.literal("brinkoffice")
            .requires(src => src.hasPermission(2))

            .then(Commands.literal("create")
                .then(Commands.argument("id", BA_StringArgumentType.word())
                    .then(Commands.literal("local")
                        .then(Commands.argument("pool", BA_StringArgumentType.word())
                            .then(Commands.argument("name", BA_StringArgumentType.greedyString())
                                .executes(ctx => {
                                    let id = BA_StringArgumentType.getString(ctx, "id")
                                    let pool = BA_StringArgumentType.getString(ctx, "pool")
                                    let name = BA_StringArgumentType.getString(ctx, "name")

                                    global.BrinkOffices.register(ctx.source.server, {
                                        id: id,
                                        name: name,
                                        kind: "local",
                                        pool: pool,
                                        contractBlock: null,
                                        inputChest: null,
                                        outputChest: null
                                    })

                                    ctx.source.sendSuccess("Created local office: " + id, false)
                                    return 1
                                })
                            )
                        )
                    )
                    .then(Commands.literal("train")
                        .then(Commands.argument("pool", BA_StringArgumentType.word())
                            .then(Commands.argument("name", BA_StringArgumentType.greedyString())
                                .executes(ctx => {
                                    let id = BA_StringArgumentType.getString(ctx, "id")
                                    let pool = BA_StringArgumentType.getString(ctx, "pool")
                                    let name = BA_StringArgumentType.getString(ctx, "name")

                                    global.BrinkOffices.register(ctx.source.server, {
                                        id: id,
                                        name: name,
                                        kind: "train",
                                        pool: pool,
                                        contractBlock: null,
                                        inputChest: null,
                                        outputChest: null
                                    })

                                    ctx.source.sendSuccess("Created train office: " + id, false)
                                    return 1
                                })
                            )
                        )
                    )
                )
            )

            .then(Commands.literal("set")
                .then(Commands.argument("id", BA_StringArgumentType.word())
                    .then(Commands.literal("lectern")
                        .executes(ctx => {
                            let player = ctx.source.player
                            if (!player) return 0
                            let block = BA_targetBlock(player)
                            if (!block) { player.tell("§cLook at a block first."); return 0 }

                            let id = BA_StringArgumentType.getString(ctx, "id")
                            let offices = global.BrinkOffices.loadDynamic(ctx.source.server)
                            if (!offices[id]) { player.tell("§cUnknown dynamic office: " + id); return 0 }

                            offices[id].contractBlock = global.BrinkUtil.pos(block)
                            global.BrinkOffices.saveDynamic(ctx.source.server, offices)
                            player.tell("§aSet lectern for " + id + " to " + block.id + " at " + block.x + " " + block.y + " " + block.z)
                            return 1
                        })
                    )
                    .then(Commands.literal("input")
                        .executes(ctx => {
                            let player = ctx.source.player
                            if (!player) return 0
                            let block = BA_targetBlock(player)
                            if (!block) { player.tell("§cLook at a block first."); return 0 }

                            let id = BA_StringArgumentType.getString(ctx, "id")
                            let offices = global.BrinkOffices.loadDynamic(ctx.source.server)
                            if (!offices[id]) { player.tell("§cUnknown dynamic office: " + id); return 0 }

                            offices[id].inputChest = global.BrinkUtil.pos(block)
                            global.BrinkOffices.saveDynamic(ctx.source.server, offices)
                            player.tell("§aSet input for " + id + " to " + block.id + " at " + block.x + " " + block.y + " " + block.z)
                            return 1
                        })
                    )
                    .then(Commands.literal("output")
                        .executes(ctx => {
                            let player = ctx.source.player
                            if (!player) return 0
                            let block = BA_targetBlock(player)
                            if (!block) { player.tell("§cLook at a block first."); return 0 }

                            let id = BA_StringArgumentType.getString(ctx, "id")
                            let offices = global.BrinkOffices.loadDynamic(ctx.source.server)
                            if (!offices[id]) { player.tell("§cUnknown dynamic office: " + id); return 0 }

                            offices[id].outputChest = global.BrinkUtil.pos(block)
                            global.BrinkOffices.saveDynamic(ctx.source.server, offices)
                            player.tell("§aSet output for " + id + " to " + block.id + " at " + block.x + " " + block.y + " " + block.z)
                            return 1
                        })
                    )
                )
            )

            .then(Commands.literal("refreshledger")
                .then(Commands.argument("id", BA_StringArgumentType.word())
                    .executes(ctx => {
                        let id = BA_StringArgumentType.getString(ctx, "id")
                        let office = global.BrinkOffices.dynamicById(ctx.source.server, id)
                        if (!office) {
                            ctx.source.sendFailure("Unknown dynamic office: " + id)
                            return 0
                        }

                        let level = ctx.source.server.getLevel("minecraft:overworld")
                        if (!level || !office.contractBlock) return 0

                        let book = global.BrinkLedgers.makeBookForOffice(office)
                        let ok = global.BrinkLedgers.placeBookInLectern(level, office.contractBlock, book)

                        if (ok) ctx.source.sendSuccess("Refreshed ledger for " + id, false)
                        else ctx.source.sendFailure("Could not place ledger. Is the lectern loaded and inventory-readable?")
                        return ok ? 1 : 0
                    })
                )
            )

            .then(Commands.literal("remove")
                .then(Commands.argument("id", BA_StringArgumentType.word())
                    .executes(ctx => {
                        let id = BA_StringArgumentType.getString(ctx, "id")
                        if (global.BrinkOffices.remove(ctx.source.server, id)) {
                            ctx.source.sendSuccess("Removed dynamic office: " + id, false)
                            return 1
                        }
                        ctx.source.sendFailure("Unknown dynamic office: " + id)
                        return 0
                    })
                )
            )

            .then(Commands.literal("list")
                .executes(ctx => {
                    let offices = global.BrinkOffices.all(ctx.source.server)
                    if (offices.length <= 0) {
                        ctx.source.sendSuccess("No Brink offices registered.", false)
                        return 1
                    }
                    let names = []
                    for (let o of offices) names.push(o.id + "(" + o.kind + "/" + o.pool + "/" + o.source + ")")
                    ctx.source.sendSuccess("Brink offices: " + names.join(", "), false)
                    return 1
                })
            )

            .then(Commands.literal("info")
                .then(Commands.argument("id", BA_StringArgumentType.word())
                    .executes(ctx => {
                        let id = BA_StringArgumentType.getString(ctx, "id")
                        for (let o of global.BrinkOffices.all(ctx.source.server)) {
                            if (o.id == id) {
                                ctx.source.sendSuccess(JSON.stringify(o), false)
                                return 1
                            }
                        }
                        ctx.source.sendFailure("Unknown office: " + id)
                        return 0
                    })
                )
            )
    )
})
