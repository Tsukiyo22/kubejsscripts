console.info("[Brink Logistics] 03_util.js ACTIVE")

global.BrinkUtil = {
    isAt(block, pos) {
        return String(block.x) == String(pos.x) &&
               String(block.y) == String(pos.y) &&
               String(block.z) == String(pos.z)
    },

    pos(block) {
        return { x: block.x, y: block.y, z: block.z }
    },

    receiptNumber(prefix) {
        return prefix + "-" + String(Math.floor(Math.random() * 900000) + 100000)
    },

    contractIdsInPool(pool) {
        let ids = []
        for (let id in global.BrinkContracts) {
            if (global.BrinkContracts[id].pool == pool) ids.push(id)
        }
        return ids
    },

    groupContractsByCategory(pool) {
        let groups = {}

        for (let id of this.contractIdsInPool(pool)) {
            let contract = global.BrinkContracts[id]
            let category = contract.category || "General"
            if (!groups[category]) groups[category] = []
            groups[category].push(id)
        }

        return groups
    },

    requirementText(contract) {
        let lines = []
        for (let req of contract.items) lines.push(req.amount + "x " + req.item)
        return lines.join("\\n")
    },

    makeContractPaper(contractId, issuerName) {
        let contract = global.BrinkContracts[contractId]
        let order = contract.type == "train" ? this.receiptNumber("FR") : this.receiptNumber("LD")
        let lore = []

        lore.push(JSON.stringify({ text: "━━━━━━━━━━━━━━━━━━━━", color: "dark_gray", italic: false }))
        lore.push(JSON.stringify({ text: "Issuer: " + issuerName, color: "gray", italic: false }))
        lore.push(JSON.stringify({ text: "Order: " + order, color: "yellow", italic: false }))
        lore.push(JSON.stringify({ text: contract.type == "train" ? "Type: Freight Manifest" : "Type: Local Work Order", color: "gray", italic: false }))
        lore.push(JSON.stringify({ text: "Payment: $" + contract.payout, color: "green", italic: false }))
        lore.push(JSON.stringify({ text: "Required Shipment:", color: "white", italic: false }))

        for (let req of contract.items) {
            lore.push(JSON.stringify({ text: "• " + req.amount + "x " + req.item, color: "yellow", italic: false }))
        }

        lore.push(JSON.stringify({ text: "━━━━━━━━━━━━━━━━━━━━", color: "dark_gray", italic: false }))
        lore.push(JSON.stringify({ text: "Submit with goods in the office input chest.", color: "dark_gray", italic: false }))

        return Item.of("minecraft:paper", {
            brink_contract: 1,
            contract_id: contractId,
            order_id: order,
            display: {
                Name: JSON.stringify({
                    text: contract.type == "train" ? "Freight Manifest: " + contract.name : "Work Order: " + contract.name,
                    color: contract.type == "train" ? "aqua" : "gold",
                    italic: false
                }),
                Lore: lore
            }
        })
    },

    contractIdFromPaper(stack) {
        if (!stack || stack.empty) return null
        if (String(stack.id) != "minecraft:paper") return null
        if (!stack.nbt) return null

        let nbt = String(stack.nbt)
        if (!nbt.includes("brink_contract")) return null

        for (let id in global.BrinkContracts) {
            if (nbt.includes(id)) return id
        }

        return null
    },

    makeSealedFreightCrate(contractId, issuerName) {
        let contract = global.BrinkContracts[contractId]
        let receipt = this.receiptNumber("BLA")

        return Item.of(global.BrinkConfig.sealedCrateItem, {
            brink_freight_crate: 1,
            receipt: receipt,
            contract_id: contractId,
            contract_name: contract.name,
            issuer: issuerName,
            sealed: 1,
            payout_hidden: contract.payout,
            display: {
                Name: JSON.stringify({ text: "Sealed Freight Crate", color: "gold", italic: false }),
                Lore: [
                    JSON.stringify({ text: "━━━━━━━━━━━━━━━━━━━━", color: "dark_gray", italic: false }),
                    JSON.stringify({ text: "Receipt: " + receipt, color: "yellow", italic: false }),
                    JSON.stringify({ text: "Contract: " + contract.name, color: "white", italic: false }),
                    JSON.stringify({ text: "Issuer: " + issuerName, color: "gray", italic: false }),
                    JSON.stringify({ text: "Status: SEALED", color: "green", italic: false }),
                    JSON.stringify({ text: "Value: CLASSIFIED", color: "dark_gray", italic: false }),
                    JSON.stringify({ text: "━━━━━━━━━━━━━━━━━━━━", color: "dark_gray", italic: false }),
                    JSON.stringify({ text: "Keep in inventory and open with Create wrench.", color: "dark_red", italic: false })
                ]
            }
        })
    },

    payoutFromCrate(stack) {
        if (!stack || stack.empty) return 0
        if (String(stack.id) != global.BrinkConfig.sealedCrateItem) return 0
        if (!stack.nbt) return 0

        let nbt = String(stack.nbt)
        if (!nbt.includes("brink_freight_crate")) return 0

        let match = nbt.match(/payout_hidden[:=] ?(\d+)/)
        if (match && match[1]) return parseInt(match[1])

        return 0
    }
}
