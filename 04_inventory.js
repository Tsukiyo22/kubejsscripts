console.info("[Brink Logistics] 04_inventory.js ACTIVE")

global.BrinkInventory = {
    getContainer(block) {
        if (!block) return null
        if (!block.inventory) return null
        return block.inventory
    },

    countItem(inv, itemId) {
        let total = 0
        for (let i = 0; i < inv.slots; i++) {
            let stack = inv.getStackInSlot(i)
            if (!stack.empty && String(stack.id) == itemId) total += stack.count
        }
        return total
    },

    hasAllItems(inv, contract) {
        for (let req of contract.items) {
            if (this.countItem(inv, req.item) < req.amount) return false
        }
        return true
    },

    removeItem(inv, itemId, amount) {
        let left = amount
        for (let i = 0; i < inv.slots; i++) {
            let stack = inv.getStackInSlot(i)
            if (!stack.empty && String(stack.id) == itemId) {
                let take = Math.min(stack.count, left)
                stack.count -= take
                left -= take
                inv.setStackInSlot(i, stack)
                if (left <= 0) return true
            }
        }
        return false
    },

    removeAllItems(inv, contract) {
        for (let req of contract.items) this.removeItem(inv, req.item, req.amount)
    },

    clearSlot(inv, slot) {
        inv.setStackInSlot(slot, Item.empty)
    },

    insertItem(inv, itemStack) {
        for (let i = 0; i < inv.slots; i++) {
            let stack = inv.getStackInSlot(i)
            if (stack.empty) {
                inv.setStackInSlot(i, itemStack)
                return true
            }
        }
        return false
    },

    insertMoney(inv, amount) {
        for (let bill of global.BrinkConfig.moneyItems) {
            while (amount >= bill.value) {
                if (!this.insertItem(inv, Item.of(bill.item))) return false
                amount -= bill.value
            }
        }
        return true
    },

    giveMoney(player, amount) {
        for (let bill of global.BrinkConfig.moneyItems) {
            let count = Math.floor(amount / bill.value)
            amount -= count * bill.value

            while (count > 0) {
                let stackCount = Math.min(count, 64)
                player.give(Item.of(bill.item, stackCount))
                count -= stackCount
            }
        }
    },

    findCompletableContract(inv, expectedType) {
        for (let i = 0; i < inv.slots; i++) {
            let stack = inv.getStackInSlot(i)
            let contractId = global.BrinkUtil.contractIdFromPaper(stack)
            if (contractId == null) continue

            let contract = global.BrinkContracts[contractId]
            if (!contract || contract.type != expectedType) continue

            if (this.hasAllItems(inv, contract)) {
                return { slot: i, contractId: contractId, contract: contract }
            }
        }
        return null
    },

    removeOneSealedCrateFromPlayer(player) {
        let stacks = player.inventory.allItems
        for (let i = 0; i < stacks.length; i++) {
            let stack = stacks[i]
            let payout = global.BrinkUtil.payoutFromCrate(stack)
            if (payout > 0) {
                stack.count -= 1
                return payout
            }
        }
        return 0
    }
}
