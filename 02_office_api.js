console.info("[Brink Logistics] 02_office_api.js ACTIVE")

global.BrinkOfficeDataKey = "brink_logistics_v2_offices"
global.BrinkSurveyDataKey = "brink_logistics_v2_survey"

function BO_loadDynamicOffices(server) {
    let raw = server.persistentData.getString(global.BrinkOfficeDataKey)
    if (!raw || raw.length <= 0) return {}

    try {
        return JSON.parse(raw)
    } catch (e) {
        console.error("[Brink Logistics] Failed to load dynamic offices: " + e)
        return {}
    }
}

function BO_saveDynamicOffices(server, offices) {
    server.persistentData.putString(global.BrinkOfficeDataKey, JSON.stringify(offices))
}

global.BrinkOffices = {
    loadDynamic(server) {
        return BO_loadDynamicOffices(server)
    },

    saveDynamic(server, offices) {
        BO_saveDynamicOffices(server, offices)
    },

    all(server) {
        let result = []

        let statics = global.BrinkConfig.staticOffices || {}
        for (let id in statics) {
            let s = statics[id]
            result.push({
                id: s.id || id,
                name: s.name || id,
                kind: s.kind,
                pool: s.pool,
                contractBlock: s.contractBlock,
                inputChest: s.inputChest,
                outputChest: s.outputChest,
                source: "static"
            })
        }

        let dynamic = this.loadDynamic(server)
        for (let id in dynamic) {
            let s = dynamic[id]
            result.push({
                id: s.id || id,
                name: s.name || id,
                kind: s.kind,
                pool: s.pool,
                contractBlock: s.contractBlock,
                inputChest: s.inputChest,
                outputChest: s.outputChest,
                source: "dynamic"
            })
        }

        return result
    },

    dynamicById(server, id) {
        let offices = this.loadDynamic(server)
        return offices[id] || null
    },

    register(server, office) {
        let offices = this.loadDynamic(server)
        offices[office.id] = office
        this.saveDynamic(server, offices)
    },

    remove(server, id) {
        let offices = this.loadDynamic(server)
        if (!offices[id]) return false
        delete offices[id]
        this.saveDynamic(server, offices)
        return true
    },

    isComplete(office) {
        return office && office.contractBlock && office.inputChest && office.outputChest
    },

    near(player, pool) {
        let offices = this.all(player.server)
        let radius = global.BrinkConfig.stationRadius || 6
        let radiusSq = radius * radius

        for (let office of offices) {
            if (office.pool != pool) continue
            if (!office.contractBlock) continue

            let p = office.contractBlock
            let dx = player.x - p.x
            let dy = player.y - p.y
            let dz = player.z - p.z

            if ((dx * dx + dy * dy + dz * dz) <= radiusSq) return office
        }

        return null
    }
}
