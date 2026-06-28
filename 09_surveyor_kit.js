console.info("[Brink Logistics] 07_surveyor_kit.js ACTIVE")

var BK_STATION_KEY = "brink_logistics_stations"

function BK_loadStations(server) {
    let raw = server.persistentData.getString(BK_STATION_KEY)
    if (!raw || raw.length <= 0) return {}
    try { return JSON.parse(raw) } catch (e) { return {} }
}

function BK_saveStations(server, stations) {
    server.persistentData.putString(BK_STATION_KEY, JSON.stringify(stations))
}

function BK_pos(block) {
    return { x: block.x, y: block.y, z: block.z }
}

function BK_makeKit(kind) {
    let name = kind == "train" ? "Freight Depot Surveyor's Kit" : "Local Office Surveyor's Kit"

    return Item.of("minecraft:paper", {
        brink_surveyor_kit: 1,
        kind: kind,
        display: {
            Name: JSON.stringify({ text: name, color: kind == "train" ? "aqua" : "gold", italic: false }),
            Lore: [
                JSON.stringify({ text: "Right-click to begin survey.", color: "gray", italic: false }),
                JSON.stringify({ text: "Then click: Lectern, Input, Output.", color: "yellow", italic: false }),
                JSON.stringify({ text: "Sneak-right-click to cancel.", color: "dark_gray", italic: false })
            ]
        }
    })
}

function BK_isKit(stack) {
    if (!stack || stack.empty) return false
    if (String(stack.id) != "minecraft:paper") return false
    if (!stack.nbt) return false
    return String(stack.nbt).includes("brink_surveyor_kit")
}

function BK_kind(stack) {
    let nbt = String(stack.nbt)
    if (nbt.includes("train")) return "train"
    return "local"
}

function BK_pool(kind) {
    return kind == "train" ? "train_tier2" : "local_basic"
}

function BK_name(kind) {
    return kind == "train" ? "Freight Depot" : "Local Contractor Office"
}

function BK_getData(player) {
    let raw = player.persistentData.getString("brink_surveyor_data")
    if (!raw || raw.length <= 0) return null
    try { return JSON.parse(raw) } catch (e) { return null }
}

function BK_setData(player, data) {
    player.persistentData.putString("brink_surveyor_data", JSON.stringify(data))
}

function BK_clearData(player) {
    player.persistentData.putString("brink_surveyor_data", "")
}

function BK_start(player, kind) {
    BK_setData(player, {
        kind: kind,
        step: "lectern",
        lectern: null,
        input: null,
        output: null
    })

    player.tell("§6Brink Surveyor started.")
    player.tell("§7Mode: §f" + (kind == "train" ? "Freight Depot" : "Local Contractor"))
    player.tell("§eStep 1/3: Right-click the lectern with the kit.")
}

function BK_makeLedger(pool, title, color) {
    let pages = []
    let ids = []

    for (let id in global.BrinkContracts) {
        if (global.BrinkContracts[id].pool == pool) ids.push(id)
    }

    pages.push(JSON.stringify({
        text: color + "§lBRINK LOGISTICS\n§8Contract Ledger\n\n§7Select a contract from the following pages."
    }))

    let perPage = 2

    for (let i = 0; i < ids.length; i += perPage) {
        let extra = []
        extra.push({ text: "§0§lAvailable Contracts\n\n" })

        let slice = ids.slice(i, i + perPage)

        for (let id of slice) {
            let c = global.BrinkContracts[id]
            extra.push({
                text: "§l► " + c.name + "\n§r§7Pay: §a$" + c.payout + "\n§8Click to request\n\n",
                clickEvent: { action: "run_command", value: "/brinkcontract take " + id },
                hoverEvent: { action: "show_text", contents: "Submit this contract at the proper office." }
            })
        }

        pages.push(JSON.stringify({ text: "", extra: extra }))
    }

    pages.push(JSON.stringify({
        text: "§0Instructions\n\n§7Place the contract paper and goods into the input chest.\n\n§7Local jobs pay cash.\n§7Freight jobs issue sealed crates."
    }))

    pages.push(JSON.stringify({
        text: "§0Opening Freight Crates\n\n§7Keep the sealed crate in your inventory, hold a §bCreate Wrench§7, then right-click."
    }))

    return Item.of("minecraft:written_book", {
        title: title,
        author: "Brink Logistics Authority",
        resolved: 1,
        pages: pages
    })
}

function BK_insertLedger(level, pos, kind) {
    let block = level.getBlock(pos.x, pos.y, pos.z)
    if (!block.inventory) return false

    let book = kind == "train"
        ? BK_makeLedger("train_tier2", "Regional Freight Ledger", "§3")
        : BK_makeLedger("local_basic", "Town Contract Ledger", "§6")

    block.inventory.setStackInSlot(0, book)
    return true
}

function BK_finish(player, level, data) {
    let stations = BK_loadStations(player.server)
    let id = "office_" + Math.floor(Math.random() * 900000 + 100000)
    let kind = data.kind

    stations[id] = {
        id: id,
        name: BK_name(kind),
        kind: kind,
        pool: BK_pool(kind),
        payoutMode: kind == "train" ? "sealed_crate" : "cash",
        contractBlock: data.lectern,
        inputChest: data.input,
        outputChest: data.output
    }

    BK_saveStations(player.server, stations)
    let placed = BK_insertLedger(level, data.lectern, kind)
    BK_clearData(player)

    player.tell("§aOffice commissioned successfully.")
    player.tell("§7ID: §f" + id)

    if (placed) player.tell("§aLedger placed into lectern.")
    else player.tell("§eOffice saved, but ledger could not be inserted.")
}

ServerEvents.commandRegistry(event => {
    let Commands = event.commands

    event.register(
        Commands.literal("brinksurveyor")
            .requires(src => src.hasPermission(2))
            .then(Commands.literal("local").executes(ctx => {
                let player = ctx.source.player
                if (!player) return 0
                player.give(BK_makeKit("local"))
                player.tell("§6Given Local Office Surveyor's Kit.")
                return 1
            }))
            .then(Commands.literal("train").executes(ctx => {
                let player = ctx.source.player
                if (!player) return 0
                player.give(BK_makeKit("train"))
                player.tell("§bGiven Freight Depot Surveyor's Kit.")
                return 1
            }))
    )
})

ItemEvents.rightClicked(event => {
    let player = event.player
    let item = event.item

    if (!player || !item) return
    if (!BK_isKit(item)) return

    if (player.shiftKeyDown) {
        BK_clearData(player)
        player.tell("§cSurvey cancelled.")
        return
    }

    let data = BK_getData(player)

    if (!data) {
        BK_start(player, BK_kind(item))
        return
    }

    let hit = player.rayTrace(8)

    if (!hit || !hit.block) {
        player.tell("§cLook at the block you want to select.")
        player.tell("§eCurrent step: §f" + data.step)
        return
    }

    let block = hit.block

    player.tell("§7Selected: §f" + block.id + " §7at §f" + block.x + " " + block.y + " " + block.z)

    if (data.step == "lectern") {
        data.lectern = BK_pos(block)
        data.step = "input"
        BK_setData(player, data)

        player.tell("§aLectern selected.")
        player.tell("§eStep 2/3: Look at the input chest and right-click air with the kit.")
        return
    }

    if (data.step == "input") {
        data.input = BK_pos(block)
        data.step = "output"
        BK_setData(player, data)

        player.tell("§aInput selected.")
        player.tell("§eStep 3/3: Look at the output chest and right-click air with the kit.")
        return
    }

    if (data.step == "output") {
        data.output = BK_pos(block)
        BK_setData(player, data)

        player.tell("§aOutput selected.")
        BK_finish(player, event.level, data)
        return
    }
})

BlockEvents.leftClicked(event => {
    let player = event.player
    let block = event.block

    if (!player || !block) return

    let item = player.mainHandItem

    if (!BK_isKit(item)) return

    let data = BK_getData(player)

    if (!data) {
        player.tell("§cSurvey is not started. Right-click air with the kit first.")
        return
    }

    event.cancel()

    player.tell("§7Survey click detected on: §f" + block.id)

    if (data.step == "lectern") {
        data.lectern = BK_pos(block)
        data.step = "input"
        BK_setData(player, data)

        player.tell("§aLectern selected: §f" + block.x + " " + block.y + " " + block.z)
        player.tell("§eStep 2/3: Left-click the input chest with the kit.")
        return
    }

    if (data.step == "input") {
        data.input = BK_pos(block)
        data.step = "output"
        BK_setData(player, data)

        player.tell("§aInput selected: §f" + block.x + " " + block.y + " " + block.z)
        player.tell("§eStep 3/3: Left-click the output chest with the kit.")
        return
    }

    if (data.step == "output") {
        data.output = BK_pos(block)
        BK_setData(player, data)

        player.tell("§aOutput selected: §f" + block.x + " " + block.y + " " + block.z)
        BK_finish(player, event.level, data)
        return
    }
})