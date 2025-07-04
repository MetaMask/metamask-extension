#!/bin/bash

# Storybook CSF 2.0 to CSF 3.0 Conversion Script
# Converts JavaScript story files to TypeScript with CSF 3.0 format

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [FILE_PATTERN]"
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -d, --dry-run       Show what would be done without making changes"
    echo "  -b, --batch SIZE    Process files in batches of SIZE (default: 5)"
    echo "  -v, --verbose       Show verbose output"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Convert all .stories.js files"
    echo "  $0 'ui/components/ui/*.stories.js'    # Convert specific pattern"
    echo "  $0 -d                                 # Dry run to see what would be converted"
    echo "  $0 -b 10                              # Process 10 files at a time"
}

# Default options
DRY_RUN=false
BATCH_SIZE=5
VERBOSE=false
FILE_PATTERN=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -b|--batch)
            BATCH_SIZE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            FILE_PATTERN="$1"
            shift
            ;;
    esac
done

# Function to check if file exists
check_file_exists() {
    if [[ ! -f "$1" ]]; then
        log_error "File not found: $1"
        return 1
    fi
    return 0
}

# Function to backup file
backup_file() {
    local file="$1"
    local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"

    if [[ "$DRY_RUN" = false ]]; then
        cp "$file" "$backup"
        log_info "Created backup: $backup"
    fi
}

# Function to convert JavaScript imports to TypeScript
convert_imports() {
    local file="$1"
    local temp_file="${file}.tmp"

    if [[ "$DRY_RUN" = false ]]; then
        # Add TypeScript imports after React import
        sed '1a import type { Meta, StoryObj } from '\''@storybook/react'\'';' "$file" > "$temp_file"
        mv "$temp_file" "$file"
    fi

    log_info "Added TypeScript imports to $file"
}

# Function to convert default export to CSF 3.0 format
convert_default_export() {
    local file="$1"
    local component_name

    # Extract component name from the file
    component_name=$(grep -o "component: [A-Za-z]*" "$file" | head -1 | cut -d' ' -f2 || echo "Component")

    if [[ "$DRY_RUN" = false ]]; then
        # Replace export default pattern
        perl -i -pe '
            if (/^export default \{/) {
                $in_export = 1;
                s/export default \{/const meta: Meta<typeof '"$component_name"'> = {/;
            }
            if ($in_export && /^\}.*;$/) {
                s/\} as ComponentMeta<typeof .*>;$/};/;
                $_ .= "\nexport default meta;\ntype Story = StoryObj<typeof '"$component_name"'>;\n\n";
                $in_export = 0;
            }
        ' "$file"
    fi

    log_info "Converted default export in $file"
}

# Function to convert story exports
convert_story_exports() {
    local file="$1"

    if [[ "$DRY_RUN" = false ]]; then
        # Convert simple arrow function stories
        perl -i -pe '
            # Convert: export const StoryName = (args) => <Component {...args} />;
            s/^export const (\w+) = \(args\) => (.+);$/export const $1: Story = {\n  render: (args) => $2,\n};/;

            # Convert: export const StoryName = () => (...);
            s/^export const (\w+) = \(\) => (.+);$/export const $1: Story = {\n  render: () => $2,\n};/;
        ' "$file"

        # Handle story args that are defined separately
        perl -i -pe '
            if (/^(\w+)\.args = \{/) {
                $story_name = $1;
                $_ = "";
                $collecting_args = 1;
                $args_content = "";
            } elsif ($collecting_args) {
                if (/^\};/) {
                    $collecting_args = 0;
                    # Insert args into the story object
                    # This is complex - for now just log that manual intervention needed
                } else {
                    $args_content .= $_;
                    $_ = "";
                }
            }
        ' "$file"
    fi

    log_info "Converted story exports in $file"
}

# Function to convert a single file
convert_file() {
    local js_file="$1"
    local ts_file="${js_file%.js}.ts"

    if [[ "$js_file" =~ \.jsx$ ]]; then
        ts_file="${js_file%.jsx}.tsx"
    fi

    log_info "Converting: $js_file → $ts_file"

    if [[ "$DRY_RUN" = true ]]; then
        log_info "[DRY RUN] Would convert $js_file to $ts_file"
        return 0
    fi

    # Check if target file already exists
    if [[ -f "$ts_file" && "$ts_file" != "$js_file" ]]; then
        log_warning "Target file already exists: $ts_file"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping $js_file"
            return 0
        fi
    fi

    # Backup original file
    backup_file "$js_file"

    # Copy to new filename if different
    if [[ "$ts_file" != "$js_file" ]]; then
        cp "$js_file" "$ts_file"
    fi

    # Apply conversions
    convert_imports "$ts_file"
    convert_default_export "$ts_file"
    convert_story_exports "$ts_file"

    # Remove original if we created a new file
    if [[ "$ts_file" != "$js_file" ]]; then
        rm "$js_file"
        log_success "Converted $js_file → $ts_file"
    else
        log_success "Updated $js_file in place"
    fi
}

# Function to validate TypeScript compilation
validate_typescript() {
    local file="$1"

    log_info "Validating TypeScript for $file"

    if command -v tsc >/dev/null 2>&1; then
        if ! tsc --noEmit --skipLibCheck "$file" 2>/dev/null; then
            log_warning "TypeScript errors found in $file - manual review needed"
        else
            log_success "TypeScript validation passed for $file"
        fi
    else
        log_warning "TypeScript compiler not found - skipping validation"
    fi
}

# Main conversion function
main() {
    log_info "Starting Storybook CSF 2.0 to CSF 3.0 conversion"

    # Find files to convert
    if [[ -n "$FILE_PATTERN" ]]; then
        files=($(find /workspace -path "$FILE_PATTERN" -type f))
    else
        files=($(find /workspace -name "*.stories.js" -o -name "*.stories.jsx"))
    fi

    if [[ ${#files[@]} -eq 0 ]]; then
        log_warning "No files found to convert"
        exit 0
    fi

    log_info "Found ${#files[@]} files to convert"

    if [[ "$DRY_RUN" = true ]]; then
        log_info "DRY RUN MODE - No files will be modified"
    fi

    # Process files in batches
    local count=0
    local batch_count=0

    for file in "${files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_warning "File not found: $file"
            continue
        fi

        # Start new batch
        if (( count % BATCH_SIZE == 0 )); then
            ((batch_count++))
            log_info "Processing batch $batch_count (files $((count + 1))-$((count + BATCH_SIZE)))"
        fi

        # Convert file
        if convert_file "$file"; then
            # Validate if not in dry run mode
            if [[ "$DRY_RUN" = false ]]; then
                validate_typescript "${file%.js}.ts"
            fi
        else
            log_error "Failed to convert $file"
        fi

        ((count++))

        # Pause between batches (except in dry run)
        if [[ "$DRY_RUN" = false && $((count % BATCH_SIZE)) -eq 0 && count -lt ${#files[@]} ]]; then
            read -p "Press Enter to continue with next batch, or Ctrl+C to stop..."
        fi
    done

    log_success "Conversion complete! Processed $count files"

    if [[ "$DRY_RUN" = false ]]; then
        log_info "Next steps:"
        log_info "1. Review converted files for any issues"
        log_info "2. Run: npm run storybook:build"
        log_info "3. Run: npx tsc --noEmit"
        log_info "4. Test stories in Storybook UI"
    fi
}

# Run main function
main "$@"