#!/bin/bash

# Default values
JOBS=$(sysctl -n hw.ncpu)  # Get number of CPU cores
BUILD_TYPE="Release"
COMPILER=""
CLEAN=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -j*)
            if [[ "$1" == "-j" ]]; then
                JOBS="$2"
                shift
            else
                JOBS="${1#-j}"
            fi
            ;;
        --clean)
            CLEAN=1
            ;;
        --debug)
            BUILD_TYPE="Debug"
            ;;
        --compiler=*)
            COMPILER="${1#*=}"
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -j N        Use N parallel jobs for compilation"
            echo "  --clean     Clean before building"
            echo "  --debug     Build in debug mode"
            echo "  --compiler=<compiler>  Specify compiler (e.g., --compiler=clang++)"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
    shift
done

# Function to check if submodule is initialized and built
check_submodule() {
    local module_path="$1"
    if [ ! -d "$module_path/.git" ]; then
        return 1  # Not initialized
    fi
    return 0
}

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

# Clean if requested
if [ $CLEAN -eq 1 ]; then
    echo "Cleaning build..."
    make -C src clean
    make -C lib/cbmc/src clean
fi

# Initialize and update submodules if needed
if ! check_submodule "lib/cbmc"; then
    echo "Initializing submodules..."
    git submodule update --init --recursive || handle_error "Failed to initialize submodules"
fi

# Build CBMC if needed
cd lib/cbmc || handle_error "Failed to enter CBMC directory"
if [ ! -f "src/cbmc/cbmc" ]; then
    git checkout $CBMC_VERSION || handle_error "Failed to checkout CBMC version"
    
    # Check and download SAT solver
    if grep '^MINISAT2' src/config.inc > /dev/null; then
        echo "Downloading MiniSat2..."
        make -C src minisat2-download > /dev/null || handle_error "Failed to download MiniSat2"
    elif grep '^GLUCOSE' src/config.inc; then
        echo "Downloading Glucose..."
        make -C src glucose-download || handle_error "Failed to download Glucose"
    else
        handle_error "SAT solver not supported"
    fi

    # Build CBMC
    echo "Building CBMC..."
    if [ -n "$COMPILER" ]; then
        make -C src CXX="$COMPILER" -j"$JOBS" || handle_error "CBMC build failed"
    else
        make -C src -j"$JOBS" || handle_error "CBMC build failed"
    fi
else
    echo "CBMC already built, skipping..."
fi
cd ../..

# Build 2LS
echo "Building 2LS..."
if [ -n "$COMPILER" ]; then
    make -C src CXX="$COMPILER" -j"$JOBS" || handle_error "2LS build failed"
else
    make -C src -j"$JOBS" || handle_error "2LS build failed"
fi

echo "Build completed successfully!"
echo "The executable is src/2ls/2ls"

# Print build information
echo -e "\nBuild Information:"
echo "Compiler: ${COMPILER:-default}"
echo "Jobs: $JOBS"
echo "Build Type: $BUILD_TYPE"
if [ -f "src/2ls/2ls" ]; then
    echo "2LS Version: $(src/2ls/2ls --version 2>&1 | head -n1)"
fi