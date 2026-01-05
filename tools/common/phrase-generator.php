<?php
/**
 * Deterministic two-word phrase generator
 * Inspired by Hitchhiker's Guide + The Matrix
 *
 * Usage:
 *   $phrase = generate_phrase($seed);
 */

function generate_phrase($seed) {
    // Adjectives / modifiers
    $adjectives = [
        'Mostly',
        'Infinite',
        'Residual',
        'PanGalactic',
        'Digital',
        'Cosmic',
        'Neural',
        'Recursive',
        'Vogon',
        'Simulated',
        'Probable',
        'Unlikely',
        'Hidden',
        'Pending',
        'Awakened'
    ];

    // Nouns / concepts
    $nouns = [
        'Harmless',
        'Improbability',
        'Signal',
        'Reality',
        'Thought',
        'Matrix',
        'Output',
        'Process',
        'Loop',
        'Choice',
        'Answer',
        'System',
        'Meaning',
        'Glitch',
        'Code'
    ];

    // Seed the PRNG (deterministic)
    mt_srand($seed);

    $adj  = $adjectives[mt_rand(0, count($adjectives) - 1)];
    $noun = $nouns[mt_rand(0, count($nouns) - 1)];

    return $adj . ' ' . $noun;
}

// ----------------------------
// Example usage
// ----------------------------

// You control the seed — e.g. student id, hash, or submission id
$seed = 357664;  

echo generate_phrase($seed);


