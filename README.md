# kubejsscripts
Where I will upload my Kubejs scripts for modpacks I work on.

Feel free to download and upload to ..\minecraft\Instances\Brink Of War\kubejs\server_scripts. For a better runtime use a subfolder in server_scripts with all the .js files in the subfolder.

Open your game OR /reload within the game to enable the scripts

# Brink Logistics v2 Framework

## Overview

Brink Logistics is a modular logistics framework for Minecraft using
KubeJS.

It supports two workflows:

### Admin Mode

-   `/brinkstation` commands
-   `/brinkledger` commands
-   Fast setup for testing and world building

### Survival Mode (v2)

-   Brink Surveyor's Kit
-   Player-built contractor offices
-   Automatic office registration
-   Automatic ledger generation
-   Automatic office validation

------------------------------------------------------------------------

# Current Features

## Local Contractors

-   Small deliveries
-   Cash payouts
-   Dynamic ledgers
-   Category support

## Freight Depots

-   Large shipments
-   Sealed freight crates
-   Physical payroll
-   Create Wrench crate opening

## Dynamic Ledgers

Generated directly from the contract registry.

Adding a contract to the proper pool automatically makes it available
after: - `/reload` - Refreshing or regenerating the ledger.

------------------------------------------------------------------------

# Folder Layout

    brink_contracts/
    ├── 00_config.js
    ├── 01_contracts.js
    ├── 02_util.js
    ├── 03_inventory.js
    ├── 04_interactions.js
    ├── 05_processors.js
    ├── 06_station_admin.js

------------------------------------------------------------------------

# Contract Structure

Each contract should define:

-   id
-   name
-   type
-   pool
-   category
-   payout
-   required items

Categories are used to automatically group ledger pages.

------------------------------------------------------------------------

# Office Types

## Local Contractor

-   Lectern
-   Input Chest
-   Output Chest
-   Cash payout

## Freight Depot

-   Dispatcher Lectern
-   Input Chest
-   Output Chest
-   Sealed Freight Crate payout

------------------------------------------------------------------------

# Planned v2+

-   Office API
-   Surveyor's Kit workflow
-   Automatic ledger insertion
-   Automatic office commissioning
-   Office refresh tools
-   Dynamic office registry

------------------------------------------------------------------------

# Recommended Workflow

1.  Build the office.
2.  Register the office.
3.  Generate or refresh the ledger.
4.  Players request contracts.
5.  Submit cargo.
6.  Receive payment.

The long-term goal is to keep the system data-driven so adding new
offices or contracts requires little or no code changes outside the
contract definitions.

