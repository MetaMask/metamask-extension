#include <stdio.h>
#include <string.h>
#include "bip39-hash.c"

int main() {
    const struct bip39_word *result = lookup_bip39_word("abandon", 7);
    if (result) {
        printf("Found: %s -> %d\n", result->name, result->index);
    } else {
        printf("Not found\n");
    }
    return 0;
}
