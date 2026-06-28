console.info("[Brink Logistics] 05_ledgers.js ACTIVE")

var BL_StringArgumentType = Java.loadClass("com.mojang.brigadier.arguments.StringArgumentType")

global.BrinkLedgers = {
    contractsPerPage: 2,

    makeContractEntry(contractId, contract) {
        return {
            text: "§l► " + contract.name + "\n§r§7Pay: §a$" + contract.payout + "\n§8Click to request\n\n",
            clickEvent: { action: "run_command", value: "/brinkcontract take " + contractId },
            hoverEvent: { action: "show_text", contents: "Required:\n" + global.BrinkUtil.requirementText(contract) }
        }
    },

    makeBookForOffice(office) {
        let isTrain = office.kind == "train"
        let title = isTrain ? "Regional Freight Ledger" : "Town Contract Ledger"
        let header = isTrain
            ? "§3§lREGIONAL FREIGHT\n§8" + office.name + "\n\n§7Select a freight contract category.\n\n"
            : "§6§lTOWN CONTRACTS\n§8" + office.name + "\n\n§7Select a local contract category.\n\n"

        return this.makeBookByPool(office.pool, title, "Brink Logistics Authority", header)
    },

    makeBookByPool(pool, title, author, header) {
        let pages = []
        let groups = global.BrinkUtil.groupContractsByCategory(pool)

        pages.push(JSON.stringify({
            text: header + "§8Generated from active contract registry.\n\n§7Use the following pages to select work orders."
        }))

        for (let category in groups) {
            let ids = groups[category]
            for (let i = 0; i < ids.length; i += this.contractsPerPage) {
                let extra = []
                extra.push({ text: "§0§l" + category + "\n\n" })

                let slice = ids.slice(i, i + this.contractsPerPage)
                for (let contractId of slice) {
                    let contract = global.BrinkContracts[contractId]
                    extra.push(this.makeContractEntry(contractId, contract))
                }

                pages.push(JSON.stringify({ text: "", extra: extra }))
            }
        }

        pages.push(JSON.stringify({
            text: "§0Instructions\n\n§7After selecting a contract, place the contract paper and all requested goods into the correct input chest.\n\n§7Local jobs pay cash.\n\n§7Freight jobs issue sealed crates."
        }))

        pages.push(JSON.stringify({
            text: "§0Opening Freight Crates\n\n§7Tier 2 freight contracts issue a §6Sealed Freight Crate§7.\n\n§7Keep the crate in your inventory, hold a §bCreate Wrench§7, then right-click to open it."
        }))

        return Item.of("minecraft:written_book", {
            title: title,
            author: author,
            resolved: 1,
            pages: pages
        })
    },

    placeBookInLectern(level, pos, book) {
        let block = level.getBlock(pos.x, pos.y, pos.z)
        if (!block) return false

        let inv = block.inventory
        if (!inv) return false

        inv.setStackInSlot(0, book)
        return true
    }
}
