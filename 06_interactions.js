console.info("[Brink Logistics] 06_interactions.js ACTIVE")

var BI_StringArgumentType = Java.loadClass("com.mojang.brigadier.arguments.StringArgumentType")
var BI_COOLDOWN_TICKS = 100

function BI_cooldown(player, pool) {
    let key = "brink_contract_cooldown_" + pool
    let now = player.server.tickCount
    let last = player.persistentData.getInt(key)

    if (last > 0 && now - last < BI_COOLDOWN_TICKS) {
        let remaining = Math.ceil((BI_COOLDOWN_TICKS - (now - last)) / 20)
        player.tell("§cPlease wait " + remaining + "s before requesting another contract.")
        return true
    }

    player.persistentData.putInt(key, now)
    return false
}

function BI_issueSpecificContract(player, contractId) {
    let contract = global.BrinkContracts[contractId]
    if (!contract) {
        player.tell("§cUnknown contract: " + contractId)
        return 0
    }

    let office = global.BrinkOffices.near(player, contract.pool)
    if (!office) {
        player.tell("§cYou must be near the correct contract office.")
        return 0
    }

    if (BI_cooldown(player, contract.pool)) return 0

    player.give(global.BrinkUtil.makeContractPaper(contractId, office.name))

    if (contract.type == "train") {
        player.tell("§bFreight Contract Selected: §f" + contract.name)
        player.tell("§7Reward: §6Sealed Freight Crate §7(§a$" + contract.payout + "§7)")
    } else {
        player.tell("§6Local Contract Selected: §f" + contract.name)
        player.tell("§7Payout: §a$" + contract.payout)
    }

    return 1
}

function BI_isOpeningTool(stack) {
    if (!stack || stack.empty) return false
    return String(stack.id) == global.BrinkConfig.crateOpeningTool
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    event.register(
        Commands.literal("brinkcontract")
            .then(Commands.literal("take")
                .then(Commands.argument("contract_id", BI_StringArgumentType.word())
                    .executes(ctx => {
                        let player = ctx.source.player
                        if (!player) return 0
                        let contractId = BI_StringArgumentType.getString(ctx, "contract_id")
                        return BI_issueSpecificContract(player, contractId)
                    })
                )
            )
    )

    event.register(
        Commands.literal("brinkledger")
            .requires(src => src.hasPermission(2))
            .then(Commands.literal("local")
                .executes(ctx => {
                    let player = ctx.source.player
                    if (!player) return 0
                    player.give(global.BrinkLedgers.makeBookByPool(
                        "local_basic",
                        "Town Contract Ledger",
                        "Brink Logistics Authority",
                        "§6§lTOWN CONTRACTS\n§8Local Supply Office\n\n§7Select a local contract category.\n\n"
                    ))
                    player.tell("§6Given Town Contract Ledger.")
                    return 1
                })
            )
            .then(Commands.literal("train")
                .executes(ctx => {
                    let player = ctx.source.player
                    if (!player) return 0
                    player.give(global.BrinkLedgers.makeBookByPool(
                        "train_tier2",
                        "Regional Freight Ledger",
                        "Brink Logistics Authority",
                        "§3§lREGIONAL FREIGHT\n§8Tier 2 Rail Office\n\n§7Select a freight contract category.\n\n"
                    ))
                    player.tell("§bGiven Regional Freight Ledger.")
                    return 1
                })
            )
            .then(Commands.literal("pool")
                .then(Commands.argument("pool", BI_StringArgumentType.word())
                    .executes(ctx => {
                        let player = ctx.source.player
                        if (!player) return 0
                        let pool = BI_StringArgumentType.getString(ctx, "pool")
                        player.give(global.BrinkLedgers.makeBookByPool(
                            pool,
                            "Contract Ledger",
                            "Brink Logistics Authority",
                            "§6§lCONTRACT LEDGER\n§8Pool: " + pool + "\n\n§7Select available contracts.\n\n"
                        ))
                        player.tell("§6Given ledger for pool: " + pool)
                        return 1
                    })
                )
            )
    )
})

ItemEvents.rightClicked(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return
    if (!BI_isOpeningTool(item)) return

    let payout = global.BrinkInventory.removeOneSealedCrateFromPlayer(player)
    if (payout <= 0) {
        player.tell("§cNo sealed freight crate found in your inventory.")
        return
    }

    global.BrinkInventory.giveMoney(player, payout)

    player.server.runCommandSilent("playsound minecraft:block.wood.break master " + player.username + " ~ ~ ~ 1 0.8")
    player.server.runCommandSilent("playsound minecraft:entity.item.pickup master " + player.username + " ~ ~ ~ 0.8 1.2")

    player.tell("§6Sealed freight crate opened.")
    player.tell("§aRecovered payroll cargo worth $" + payout + ".")
})
