# Quality and Blur

## Problem
The current output often looks softer than the listing photos.

## Goal
The final walkthrough should preserve as much source detail as possible.

## Pipeline target
1. Start with the highest-resolution listing photo available.
2. Generate the clip.
3. Reject clips with opening blur or obvious softness.
4. Upscale only the accepted winner.
5. Merge the upscaled clips.
6. Export the final video with a high-quality bitrate.

## Quality checks
Reject or retry clips with:
- blurry first second
- smeared architecture
- warped walls
- changed furniture
- soft faces in artwork / distorted decor
- unstable windows or door frames
- visible compression damage
- strong flicker

## Output targets
Express:
- 720p

Standard:
- 1080p

Luxury:
- 2560x1440 / 2K

Ultra:
- 3840x2160 / 4K

Important:
Upscaling does not fix a fundamentally bad AI generation.
The clip needs to be sharp enough before upscale.
