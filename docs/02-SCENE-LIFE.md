# Scene Life Rules

The scene should feel real because existing objects move naturally.

## Animate when visible
- water
- pool ripples
- lake waves
- trees
- leaves
- grass
- flags
- curtains
- fire
- fireplace flames
- candles
- ceiling fans
- smoke
- steam
- clouds
- subtle reflections

## Do not invent movement
If the source image does not contain a fan, do not add one.
If there is no fire, do not create flames.

## Required behavior
A scene with an obvious natural motion source should not come back completely dead.

Examples:
- lake visible -> water should move
- ceiling fan visible -> fan should rotate
- fireplace visible -> flames should move
- trees outside -> foliage should move

## Retry trigger
If an obvious motion source exists but nothing moves, treat the clip as weak and regenerate it.
