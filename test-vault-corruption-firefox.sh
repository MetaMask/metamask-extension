#!/bin/bash

# =============================================================================
# MetaMask Firefox Vault Corruption Test Script
# =============================================================================
# This script simulates vault corruption on Firefox to test the recovery flow.
#
# IMPORTANT:
# - Close Firefox completely before running this script!
# - Works with BOTH temporary add-ons and permanent installations
#
# Storage Architecture:
# =====================
# PRIMARY VAULT: browser.storage.local → webExtensions-storage-local IndexedDB
# BACKUP VAULT: IndexedDB → metamask-backup
# CACHED DATA: IndexedDB → localforage
#
# Temporary Add-ons (via about:debugging):
#   Stored in: moz-extension+++UUID^userContextId=4294967295/
#   ⚠️ WARNING: Data is DELETED when Firefox restarts!
#
# Permanent Installations (via about:addons):
#   Stored in: moz-extension+++UUID/
#   ✅ Data persists across Firefox restarts
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MetaMask Firefox Vault Corruption Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Firefox is running
FIREFOX_RUNNING=false
if pgrep -x "firefox" > /dev/null || pgrep -x "Firefox" > /dev/null; then
    FIREFOX_RUNNING=true
    echo -e "${YELLOW}⚠️  WARNING: Firefox is still running!${NC}"
    echo ""
    echo "Running this script while Firefox is open can cause:"
    echo "  - Database corruption (Firefox may be writing to SQLite)"
    echo "  - Changes not being applied (Firefox caches data in memory)"
    echo "  - Unexpected behavior when Firefox tries to save state"
    echo ""
    echo -e "${CYAN}Recommended: Close Firefox first, then run this script.${NC}"
    echo ""
    read -p "Continue anyway? (yes/no): " continue_anyway

    if [ "$continue_anyway" != "yes" ]; then
        echo ""
        echo "To close Firefox:"
        echo "  pkill Firefox"
        echo ""
        echo "Then run this script again."
        exit 0
    fi

    echo ""
    echo -e "${YELLOW}Continuing with Firefox open (risky!)...${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Firefox is not running${NC}"
    echo ""
fi

# Find Firefox profile
FIREFOX_PROFILES_DIR="$HOME/Library/Application Support/Firefox/Profiles"

if [ ! -d "$FIREFOX_PROFILES_DIR" ]; then
    echo -e "${RED}ERROR: Firefox profiles directory not found${NC}"
    exit 1
fi

# List available profiles
echo -e "${BLUE}Available Firefox profiles:${NC}"
PROFILES=($(ls -d "$FIREFOX_PROFILES_DIR"/*/ 2>/dev/null | xargs -n1 basename))

if [ ${#PROFILES[@]} -eq 0 ]; then
    echo -e "${RED}No Firefox profiles found!${NC}"
    exit 1
fi

for i in "${!PROFILES[@]}"; do
    echo "  $((i+1))) ${PROFILES[$i]}"
done

echo ""
read -p "Select profile [1-${#PROFILES[@]}] (default: 1): " profile_choice
profile_choice=${profile_choice:-1}

if [ "$profile_choice" -lt 1 ] || [ "$profile_choice" -gt ${#PROFILES[@]} ]; then
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

FIREFOX_PROFILE="${PROFILES[$((profile_choice-1))]}"
PROFILE_PATH="$FIREFOX_PROFILES_DIR/$FIREFOX_PROFILE"

echo -e "${GREEN}✓ Using profile: $FIREFOX_PROFILE${NC}"
echo ""

# Find MetaMask UUID from prefs.js
echo -e "${BLUE}Searching for MetaMask extension...${NC}"

# Firefox escapes quotes in prefs.js with backslashes: \"UUID\"
# So we need to match: webextension@metamask.io\":\"UUID
EXTENSION_UUID=$(grep -o 'webextension@metamask.io\\":\\"[a-f0-9-]*' "$PROFILE_PATH/prefs.js" 2>/dev/null | sed 's/webextension@metamask.io\\":\\"//' | head -1)

if [ -z "$EXTENSION_UUID" ]; then
    # Fallback: try with Perl (more reliable for complex patterns)
    EXTENSION_UUID=$(perl -ne 'print "$1\n" if /webextension\@metamask\.io\\":\\"([a-f0-9-]+)/' "$PROFILE_PATH/prefs.js" 2>/dev/null | head -1)
fi

if [ -z "$EXTENSION_UUID" ]; then
    echo -e "${RED}ERROR: MetaMask extension UUID not found in profile${NC}"
    echo "Make sure MetaMask has been installed/loaded at least once."
    echo ""
    echo "Debug info - lines containing metamask:"
    grep -i "metamask" "$PROFILE_PATH/prefs.js" 2>/dev/null | head -3 || echo "No metamask references found"
    exit 1
fi

echo -e "${GREEN}✓ Found MetaMask UUID: $EXTENSION_UUID${NC}"
echo ""

# Determine storage type (temporary vs permanent)
EXTENSION_STORAGE="$PROFILE_PATH/storage/default/moz-extension+++$EXTENSION_UUID"
TEMP_STORAGE="$PROFILE_PATH/storage/default/moz-extension+++$EXTENSION_UUID^userContextId=4294967295"

# Check which storage exists
HAS_PERMANENT=false
HAS_TEMPORARY=false

if [ -d "$EXTENSION_STORAGE/idb" ]; then
    HAS_PERMANENT=true
fi

if [ -d "$TEMP_STORAGE/idb" ]; then
    HAS_TEMPORARY=true
fi

echo -e "${BLUE}Storage Detection:${NC}"
echo "---"

if $HAS_PERMANENT; then
    echo -e "  ${GREEN}✓${NC} Permanent installation storage found"
fi

if $HAS_TEMPORARY; then
    echo -e "  ${YELLOW}⚠${NC} Temporary add-on storage found (userContextId=4294967295)"
    echo -e "    ${YELLOW}Note: This data is deleted when Firefox restarts!${NC}"
fi

if ! $HAS_PERMANENT && ! $HAS_TEMPORARY; then
    echo -e "  ${RED}✗${NC} No MetaMask storage found!"
    exit 1
fi

echo ""

# Determine which storage to use
if $HAS_TEMPORARY; then
    ACTIVE_STORAGE="$TEMP_STORAGE"
    STORAGE_TYPE="temporary"
    echo -e "${YELLOW}Using TEMPORARY add-on storage (userContextId=4294967295)${NC}"
    echo -e "${YELLOW}⚠️  Data will be lost when Firefox restarts!${NC}"
else
    ACTIVE_STORAGE="$EXTENSION_STORAGE"
    STORAGE_TYPE="permanent"
    echo -e "${GREEN}Using PERMANENT installation storage${NC}"
fi

echo ""
IDB_PATH="$ACTIVE_STORAGE/idb"

# Find databases
echo -e "${BLUE}Current Storage State:${NC}"
echo "---"

# Find PRIMARY vault (webExtensions-storage-local)
PRIMARY_DB=""
PRIMARY_FILES=""
for db in "$IDB_PATH"/*.sqlite; do
    if [ -f "$db" ]; then
        db_name=$(sqlite3 "$db" "SELECT name FROM database LIMIT 1;" 2>/dev/null)
        if [[ "$db_name" == *"webExtensions-storage-local"* ]]; then
            PRIMARY_DB="$db"
            PRIMARY_FILES="${db%.sqlite}.files"
            break
        fi
    fi
done

if [ -n "$PRIMARY_DB" ]; then
    echo ""
    echo -e "${CYAN}PRIMARY VAULT (browser.storage.local → IndexedDB):${NC}"
    echo "  Database: $(basename "$PRIMARY_DB")"
    echo "  Keys (ROT-1 encoded):"
    sqlite3 "$PRIMARY_DB" "SELECT '    - ' || key || ' (data: ' || length(data) || ' bytes, file_ids: ' || COALESCE(file_ids, 'none') || ')' FROM object_data ORDER BY length(data) DESC;" 2>/dev/null || echo "    (unable to read)"

    if [ -d "$PRIMARY_FILES" ]; then
        echo "  External files:"
        for f in "$PRIMARY_FILES"/*; do
            if [ -f "$f" ]; then
                size=$(ls -lh "$f" 2>/dev/null | awk '{print $5}')
                echo "    - $(basename "$f") ($size)"
            fi
        done 2>/dev/null
    fi
else
    echo -e "${YELLOW}PRIMARY VAULT: Not found (extension may not be initialized)${NC}"
fi

# Find BACKUP vault (metamask-backup)
BACKUP_DB=""
BACKUP_FILES=""
for db in "$IDB_PATH"/*.sqlite; do
    if [ -f "$db" ]; then
        db_name=$(sqlite3 "$db" "SELECT name FROM database LIMIT 1;" 2>/dev/null)
        if [[ "$db_name" == *"metamask-backup"* ]]; then
            BACKUP_DB="$db"
            BACKUP_FILES="${db%.sqlite}.files"
            break
        fi
    fi
done

if [ -n "$BACKUP_DB" ]; then
    echo ""
    echo -e "${CYAN}BACKUP VAULT (IndexedDB: metamask-backup):${NC}"
    echo "  Database: $(basename "$BACKUP_DB")"
    echo "  Keys (ROT-1 encoded):"
    sqlite3 "$BACKUP_DB" "SELECT '    - ' || key || ' (' || length(data) || ' bytes)' FROM object_data ORDER BY length(data) DESC;" 2>/dev/null || echo "    (unable to read)"
fi

# Find CACHED data (localforage)
LOCALFORAGE_DB=""
LOCALFORAGE_FILES=""
for db in "$IDB_PATH"/*.sqlite; do
    if [ -f "$db" ]; then
        db_name=$(sqlite3 "$db" "SELECT name FROM database LIMIT 1;" 2>/dev/null)
        if [[ "$db_name" == *"localforage"* ]]; then
            LOCALFORAGE_DB="$db"
            LOCALFORAGE_FILES="${db%.sqlite}.files"
            break
        fi
    fi
done

if [ -n "$LOCALFORAGE_DB" ]; then
    echo ""
    echo -e "${CYAN}CACHED DATA (IndexedDB: localforage):${NC}"
    echo "  Database: $(basename "$LOCALFORAGE_DB")"
    echo "  Keys (ROT-1 encoded):"
    sqlite3 "$LOCALFORAGE_DB" "SELECT '    - ' || key || ' (' || length(data) || ' bytes)' FROM object_data ORDER BY length(data) DESC LIMIT 5;" 2>/dev/null || echo "    (unable to read)"
fi

echo ""
echo "---"
echo ""

# Helper function to drop Firefox triggers before modifying
drop_triggers() {
    local db="$1"
    sqlite3 "$db" "DROP TRIGGER IF EXISTS object_data_delete_trigger;" 2>/dev/null
    sqlite3 "$db" "DROP TRIGGER IF EXISTS object_data_update_trigger;" 2>/dev/null
    sqlite3 "$db" "DROP TRIGGER IF EXISTS object_data_insert_trigger;" 2>/dev/null
    sqlite3 "$db" "DROP TRIGGER IF EXISTS file_update_trigger;" 2>/dev/null
}

# Menu
echo -e "${YELLOW}Select corruption type:${NC}"
echo ""
echo "  === Primary Vault Corruption Tests ==="
echo "  1) ${RED}FULL corruption${NC}: Drop triggers + delete data/meta + delete files + clear refs"
echo "     → Storage becomes structurally corrupted (writes fail)"
echo ""
echo "  2) Drop triggers ONLY (keep data intact)"
echo "     → Tests: get() works, set() fails"
echo ""
echo "  3) Clear file references only (keep files intact)"
echo "     → Tests orphaned files scenario"
echo ""
echo "  4) Delete external files only (keep database intact)"
echo "     → Tests file ID mismatch scenario"
echo ""
echo "  5) Delete 'data' and 'meta' keys + delete BACKUP vault"
echo "     → Expected: Fresh install flow (no recovery possible)"
echo ""
echo "  === Cleanup ==="
echo "  6) ${RED}NUCLEAR: Delete ALL MetaMask storage (fresh start)${NC}"
echo "     → Fixes 'An unexpected error occurred' after reinstall"
echo ""
echo "  7) Exit without changes"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}FULL corruption of PRIMARY vault...${NC}"
        echo -e "${RED}This will make storage structurally corrupted (writes will fail)${NC}"

        if [ -z "$PRIMARY_DB" ]; then
            echo -e "${RED}ERROR: Primary vault database not found!${NC}"
            echo "The extension may not have been initialized with a wallet."
            exit 1
        fi

        # Drop Firefox triggers (makes writes fail!)
        echo "Dropping Firefox triggers..."
        drop_triggers "$PRIMARY_DB"
        echo -e "${GREEN}✓ Triggers dropped (storage writes will now fail!)${NC}"

        # Delete the data key (0ebub = "data" in ROT-1)
        sqlite3 "$PRIMARY_DB" "DELETE FROM object_data WHERE key LIKE '%ebub%' OR key LIKE '%data%';"
        echo -e "${GREEN}✓ Deleted 'data' key${NC}"

        # Delete the meta key (0nfub = "meta" in ROT-1)
        sqlite3 "$PRIMARY_DB" "DELETE FROM object_data WHERE key LIKE '%nfub%' OR key LIKE '%meta%';"
        echo -e "${GREEN}✓ Deleted 'meta' key${NC}"

        # Delete external files
        if [ -d "$PRIMARY_FILES" ]; then
            rm -rf "$PRIMARY_FILES"/*
            echo -e "${GREEN}✓ Deleted external files${NC}"
        fi

        # Clear file references
        sqlite3 "$PRIMARY_DB" "DELETE FROM file;" 2>/dev/null || true
        echo -e "${GREEN}✓ Cleared file references${NC}"

        echo ""
        echo -e "${RED}✗ PRIMARY vault is now FULLY corrupted!${NC}"
        echo ""
        echo -e "${BLUE}The IndexedDB backup (metamask-backup) is still intact.${NC}"
        echo ""
        echo -e "${YELLOW}Expected behavior:${NC}"
        echo "  - Vault recovery flow should trigger"
        echo "  - After entering password, writes will FAIL"
        echo "  - 'Storage is corrupted' message should appear"
        ;;

    2)
        echo ""
        echo -e "${YELLOW}Dropping triggers ONLY (keeping data intact)...${NC}"

        if [ -z "$PRIMARY_DB" ]; then
            echo -e "${RED}ERROR: Primary vault database not found!${NC}"
            exit 1
        fi

        # Drop Firefox triggers (makes writes fail!)
        echo "Dropping Firefox triggers..."
        drop_triggers "$PRIMARY_DB"
        echo -e "${GREEN}✓ Triggers dropped${NC}"

        echo ""
        echo -e "${GREEN}✓ Trigger corruption complete!${NC}"
        echo ""
        echo -e "${BLUE}Data is still intact. Only triggers are removed.${NC}"
        echo ""
        echo -e "${YELLOW}Expected behavior:${NC}"
        echo "  - browser.storage.local.get() should WORK"
        echo "  - browser.storage.local.set() should FAIL"
        echo "  - MetaMask opens normally but can't save state changes"
        echo "  - After restart: 'An unexpected error occurred'"
        ;;

    3)
        echo ""
        echo -e "${YELLOW}Clearing file references from PRIMARY vault...${NC}"

        if [ -z "$PRIMARY_DB" ]; then
            echo -e "${RED}ERROR: Primary vault database not found!${NC}"
            exit 1
        fi

        # Must drop triggers to modify file table
        echo "Dropping triggers (required for deletion)..."
        drop_triggers "$PRIMARY_DB"
        echo -e "${GREEN}✓ Triggers dropped${NC}"

        sqlite3 "$PRIMARY_DB" "DELETE FROM file;" 2>/dev/null || true
        echo -e "${GREEN}✓ File references cleared${NC}"

        echo ""
        echo -e "${GREEN}✓ File reference clearing complete!${NC}"
        echo ""
        echo "External files still exist, but database no longer references them."
        echo ""
        echo -e "${YELLOW}Expected behavior:${NC}"
        echo "  - Orphaned files scenario"
        echo "  - MetaMask behavior depends on how data was stored"
        ;;

    4)
        echo ""
        echo -e "${YELLOW}Deleting external files from PRIMARY vault...${NC}"

        if [ -z "$PRIMARY_FILES" ] || [ ! -d "$PRIMARY_FILES" ]; then
            echo -e "${YELLOW}No external files folder found.${NC}"
            echo "Data may be stored inline in the SQLite database."
            exit 0
        fi

        echo "External files in PRIMARY vault:"
        ls -la "$PRIMARY_FILES" 2>/dev/null | tail -n +4

        find "$PRIMARY_FILES" -type f -delete 2>/dev/null
        echo -e "${GREEN}✓ External files deleted${NC}"

        echo ""
        echo -e "${GREEN}✓ External file deletion complete!${NC}"
        echo ""
        echo "Database still references these files, but they no longer exist."
        echo ""
        echo -e "${YELLOW}Expected behavior:${NC}"
        echo "  - MetaMask may fail to read vault data"
        echo "  - Could result in 'An unexpected error occurred'"
        echo "  - Note: Firefox may self-heal by regenerating files"
        ;;

    5)
        echo ""
        echo -e "${RED}WARNING: This will delete primary vault data AND backup!${NC}"
        echo -e "${RED}Recovery will NOT be possible without the SRP!${NC}"
        read -p "Are you sure? (yes/no): " confirm

        if [ "$confirm" != "yes" ]; then
            echo "Aborted."
            exit 0
        fi

        echo ""
        echo -e "${YELLOW}Deleting 'data' and 'meta' from PRIMARY + deleting BACKUP...${NC}"

        # Corrupt PRIMARY vault
        if [ -n "$PRIMARY_DB" ]; then
            drop_triggers "$PRIMARY_DB"
            sqlite3 "$PRIMARY_DB" "DELETE FROM object_data WHERE key LIKE '%ebub%' OR key LIKE '%data%';"
            sqlite3 "$PRIMARY_DB" "DELETE FROM object_data WHERE key LIKE '%nfub%' OR key LIKE '%meta%';"
            echo -e "${GREEN}✓ Primary vault data/meta deleted${NC}"
        else
            echo -e "${YELLOW}Primary vault not found, skipping...${NC}"
        fi

        # Delete BACKUP vault from BOTH permanent AND temporary storage
        echo ""
        echo -e "${YELLOW}Looking for backup databases in ALL storage locations...${NC}"
        backup_deleted=0

        # Check BOTH permanent and temporary storage
        for storage_path in "$EXTENSION_STORAGE/idb" "$TEMP_STORAGE/idb"; do
            if [ -d "$storage_path" ]; then
                echo ""
                echo "Checking: $storage_path"
                for db in "$storage_path"/*.sqlite; do
                    if [ -f "$db" ]; then
                        db_name=$(sqlite3 "$db" "SELECT name FROM database LIMIT 1;" 2>/dev/null)
                        echo "  Found: $(basename "$db") → $db_name"
                        # Match metamask-backup
                        if [[ "$db_name" == *"metamask-backup"* ]]; then
                            echo -e "  ${RED}→ Deleting backup database!${NC}"
                            rm -f "$db"
                            rm -rf "${db%.sqlite}.files"
                            backup_deleted=$((backup_deleted + 1))
                        fi
                    fi
                done
            fi
        done

        if [ $backup_deleted -gt 0 ]; then
            echo -e "${GREEN}✓ Deleted $backup_deleted backup database(s)${NC}"
        else
            echo -e "${YELLOW}No backup databases found.${NC}"
        fi

        echo ""
        echo -e "${RED}✗ Both primary and backup vaults are now corrupted!${NC}"
        echo ""
        echo -e "${YELLOW}Expected behavior:${NC}"
        echo "  - MetaMask should show fresh install/onboarding flow"
        echo "  - No recovery possible without SRP"
        ;;

    6)
        echo ""
        echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  WARNING: This will DELETE ALL MetaMask storage for Firefox!  ║${NC}"
        echo -e "${RED}║  You will need to set up MetaMask from scratch (new SRP).     ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "This operation will:"
        echo "  - Delete ALL extension storage folders for MetaMask"
        echo "  - Clear leftover data from previous installations"
        echo "  - Result in a completely fresh start"
        echo ""
        read -p "Type 'DELETE' to confirm: " confirm

        if [ "$confirm" != "DELETE" ]; then
            echo "Aborted."
            exit 0
        fi

        echo ""
        echo -e "${YELLOW}Finding all MetaMask storage folders...${NC}"

        # Find all MetaMask storage folders (both permanent and temporary)
        STORAGE_BASE="$PROFILE_PATH/storage/default"

        echo "Looking in: $STORAGE_BASE"
        echo ""

        # Find folders matching MetaMask extension patterns
        FOUND_FOLDERS=()
        while IFS= read -r -d '' folder; do
            FOUND_FOLDERS+=("$folder")
        done < <(find "$STORAGE_BASE" -maxdepth 1 -type d -name "moz-extension+++$EXTENSION_UUID*" -print0 2>/dev/null)

        if [ ${#FOUND_FOLDERS[@]} -eq 0 ]; then
            echo -e "${YELLOW}No MetaMask storage folders found.${NC}"
            echo "MetaMask storage is already clean."
            exit 0
        fi

        echo "Found ${#FOUND_FOLDERS[@]} MetaMask storage folder(s):"
        for folder in "${FOUND_FOLDERS[@]}"; do
            echo "  - $(basename "$folder")"
        done
        echo ""

        echo -e "${YELLOW}Deleting all MetaMask storage...${NC}"
        for folder in "${FOUND_FOLDERS[@]}"; do
            rm -rf "$folder"
            echo -e "${GREEN}✓ Deleted: $(basename "$folder")${NC}"
        done

        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  All MetaMask storage has been deleted!        ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Open Firefox"
        echo "  2. Open MetaMask"
        echo "  3. You should see a fresh onboarding experience"
        echo ""
        echo -e "${CYAN}If you still see errors, try reinstalling MetaMask.${NC}"
        exit 0
        ;;

    7)
        echo "Exiting without changes."
        exit 0
        ;;

    *)
        echo "Invalid choice."
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
if [ "$FIREFOX_RUNNING" = true ]; then
    echo -e "${YELLOW}Done! Reload MetaMask to test changes.${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Firefox was running during this operation.${NC}"
    echo -e "${YELLOW}   You may need to:${NC}"
    echo -e "${YELLOW}   1. Reload MetaMask (about:debugging → Reload)${NC}"
    echo -e "${YELLOW}   2. Or restart Firefox for changes to take effect${NC}"
else
    echo -e "${BLUE}Done! Now open Firefox and test MetaMask.${NC}"
    echo -e "${BLUE}========================================${NC}"
fi

# Check installation type via extensions.json
# - 'app-temporary' = loaded via about:debugging (temporary add-on)
# - 'app-profile' = installed permanently in profile
# - 'app-system' = system-wide installation
INSTALL_TYPE=$(python3 -c "
import json
try:
    with open('$PROFILE_PATH/extensions.json') as f:
        data = json.load(f)
    for addon in data.get('addons', []):
        if addon.get('id') == 'webextension@metamask.io':
            location = addon.get('location', 'unknown')
            # Temporary add-ons have 'app-temporary' location
            if 'temporary' in location.lower():
                print('temporary')
            elif location in ['app-profile', 'app-system', 'app-global']:
                print('permanent')
            else:
                print(f'unknown:{location}')
            break
except Exception as e:
    print(f'error:{e}')
" 2>/dev/null)

# Show appropriate message based on installation type
if [ "$INSTALL_TYPE" = "temporary" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  REMINDER: You're using a temporary add-on!${NC}"
    echo -e "${YELLOW}   Storage is cleared when the add-on is removed.${NC}"
    echo -e "${YELLOW}   For realistic testing, install MetaMask permanently.${NC}"
elif [ "$INSTALL_TYPE" = "permanent" ] && [ "$STORAGE_TYPE" = "temporary" ]; then
    echo ""
    echo -e "${CYAN}ℹ️  Note: You have a permanent installation, but the PRIMARY vault${NC}"
    echo -e "${CYAN}   is in the temporary storage folder (legacy from previous temp install).${NC}"
    echo -e "${CYAN}   This is normal if you used a temp add-on before installing permanently.${NC}"
elif [ "$INSTALL_TYPE" = "permanent" ]; then
    echo ""
    echo -e "${GREEN}✓ MetaMask is permanently installed.${NC}"
fi

echo ""
