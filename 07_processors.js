console.info("[Brink Logistics] 07_processors.js ACTIVE")

function BP_validOffice(office) {
    return office && office.inputChest && office.outputChest
}

function BP_processLocal(event, office) {
    if (!BP_validOffice(office)) return

    let level = event.server.getLevel("minecraft:overworld")
    if (!level) return

    let inputBlock = level.getBlock(office.inputChest.x, office.inputChest.y, office.inputChest.z)
    let outputBlock = level.getBlock(office.outputChest.x, office.outputChest.y, office.outputChest.z)

    let inputInv = global.BrinkInventory.getContainer(inputBlock)
    let outputInv = global.BrinkInventory.getContainer(outputBlock)
    if (!inputInv || !outputInv) return

    let paperData = global.BrinkInventory.findCompletableContract(inputInv, "local")
    if (!paperData) return

    let contract = paperData.contract
    if (!global.BrinkInventory.insertMoney(outputInv, contract.payout)) return

    global.BrinkInventory.removeAllItems(inputInv, contract)
    global.BrinkInventory.clearSlot(inputInv, paperData.slot)

    event.server.runCommandSilent(
        "playsound minecraft:entity.player.levelup master @a[x=" +
        office.inputChest.x + ",y=" + office.inputChest.y + ",z=" + office.inputChest.z +
        ",distance=..12] " + office.inputChest.x + " " + office.inputChest.y + " " + office.inputChest.z + " 0.8 1.1"
    )

    console.info("[Brink Logistics] Local contract completed at " + office.name + ": " + contract.name + " for $" + contract.payout)
}

function BP_processTrain(event, office) {
    if (!BP_validOffice(office)) return

    let level = event.server.getLevel("minecraft:overworld")
    if (!level) return

    let inputBlock = level.getBlock(office.inputChest.x, office.inputChest.y, office.inputChest.z)
    let outputBlock = level.getBlock(office.outputChest.x, office.outputChest.y, office.outputChest.z)

    let inputInv = global.BrinkInventory.getContainer(inputBlock)
    let outputInv = global.BrinkInventory.getContainer(outputBlock)
    if (!inputInv || !outputInv) return

    let paperData = global.BrinkInventory.findCompletableContract(inputInv, "train")
    if (!paperData) return

    let contract = paperData.contract
    let crate = global.BrinkUtil.makeSealedFreightCrate(paperData.contractId, office.name)
    if (!global.BrinkInventory.insertItem(outputInv, crate)) return

    global.BrinkInventory.removeAllItems(inputInv, contract)
    global.BrinkInventory.clearSlot(inputInv, paperData.slot)

    event.server.runCommandSilent(
        "playsound minecraft:entity.player.levelup master @a[x=" +
        office.inputChest.x + ",y=" + office.inputChest.y + ",z=" + office.inputChest.z +
        ",distance=..20] " + office.inputChest.x + " " + office.inputChest.y + " " + office.inputChest.z + " 0.9 0.8"
    )

    console.info("[Brink Logistics] Freight contract completed at " + office.name + ": " + contract.name + " | Sealed crate issued.")
}

ServerEvents.tick(event => {
    if (event.server.tickCount % global.BrinkConfig.tickInterval != 0) return

    for (let office of global.BrinkOffices.all(event.server)) {
        if (!global.BrinkOffices.isComplete(office)) continue

        if (office.kind == "local") BP_processLocal(event, office)
        if (office.kind == "train") BP_processTrain(event, office)
    }
})
