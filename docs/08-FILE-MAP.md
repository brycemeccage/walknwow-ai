# Files Most Likely to Control These Behaviors

## Generation / Camera
app/api/walkthroughs/generate-clip/route.ts
lib/cinematography/prompt-builder.ts
lib/cinematography/profile-mapper.ts
lib/director/scene-personality.ts
lib/director/scene-life.ts

## Retry / Quality
app/api/walkthroughs/retry-manager/route.ts
engines/quality/quality-director.ts
engines/quality/consistency-engine.ts
engines/quality/retry-policy.ts

## Story / Photo Selection
app/api/walkthroughs/director/route.ts
engines/director/
engines/story/

## Editing / Transitions
app/api/walkthroughs/merge-clips/route.ts
engines/editing/luxury-editor.ts
engines/rendering/render-engine.ts

## Music
engines/music/

## Realtor Branding
engines/branding/

## Export / Quality
engines/export/
app/api/walkthroughs/upscale-video/route.ts (if implemented)

## Dashboard
app/dashboard/
components/dashboard/
