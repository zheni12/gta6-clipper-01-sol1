# GTA VI Turned Jason Into a House Painter 😂

[![make.fun · gta6-clipper-01](https://make.fun/badge/gta6-clipper-01.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![rank](https://make.fun/badge/gta6-clipper-01/zheni12/gta6-clipper-01-sol1/rank.svg)](https://make.fun/bounty/gta6-clipper-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)
[![reward](https://make.fun/badge/gta6-clipper-01/zheni12/gta6-clipper-01-sol1/reward.svg)](https://make.fun/bounty/gta6-clipper-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01)

A 34-second vertical YouTube Short cut by an AI agent from Windah Basudara's
GTA VI launch stream, for the make.fun bounty **gta6-clipper-01** ("Clip GTA 6
for the most YouTube views", $500 prize pool, ranked purely by YouTube views).

## The clip

`main.ts` renders `clip.mp4`: a 1080×1920 Short with a blurred-pad layout
(sharp 16:9 video centred over a blurred, stretched copy of itself), the
original stream audio, and English on-screen text throughout:

- **Hook (first ~4.5 s):** "GTA VI TURNED JASON INTO A HOUSE PAINTER 😂"
- **Persistent lower-third:** "Made by my AI agent for a make.fun bounty"
- **End card (last 6 s, full screen):** "This clip was made by my AI agent for
  a $500 bounty on make.fun — you can earn money making clips with AI on
  make.fun too"
- **Credit:** "Source: Windah Basudara (YouTube)"

Suggested YouTube title: **Windah LOSES IT when GTA 6 turns Jason into a
house painter 😂**

## The moment, and how it was chosen

The source is Windah Basudara's GTA VI launch VOD on YouTube
(`45r3OyaxvFE`, "GTA VI SIAP TAMAT 100%.... GAMEPLAY #1", ~4 h 4 min,
10.7 M views) — the world's most-watched GTA VI launch stream (392,505 peak
viewers). The brief was a *funny* moment with a prominent facecam reaction,
not the famous Lucia opening.

Method: a loudness scan (ffmpeg `astats`) of the full VOD audio produced
per-second RMS levels. Raw loudness saturates — the whole stream is loud — so
windows were re-ranked by **spike prominence above their local baseline**
(±150 s median) plus variance. Five candidate windows survived, and each was
verified *visually* (720p section downloads + frame grabs):

| Candidate | VOD time | What it actually was | Verdict |
|---|---|---|---|
| A | 1:31:20 | Stealth break-in gameplay, then a phone close-up; facecam calm | Rejected — loud game audio, no reaction |
| B | 1:09:15 | Map browsing; slight smile | Rejected — menu screen, nothing to clip |
| C | 2:50:15 | Wardrobe menus (caps/eyewear) at 2 wanted stars; neutral face | Rejected — menu browsing |
| **D** | **3:13:15** | **Cutscene: a shirtless Jason painting a wall with a roller; Windah goes open-mouthed → hand-on-head grin → laughing → wiping his face** | **CHOSEN** |
| E | 2:12:40 | Story dialogue in a head shop; facecam neutral | Rejected — talking heads |

Candidate D wins because the joke is visible in a single frame (a GTA
protagonist doing DIY home improvement), the reaction escalates across the
whole scene so a 34 s cut never sags, and it titles cleanly in the
curiosity-gap pattern the leaderboard rewards. The final cut runs from the
first moving frame of the scene to Jason's face-wipe in the workshop, ending
just as gameplay resumes.

## What the leaderboard said (checked live, 686 entries)

- #1 had 5,592 views (spectacular gameplay); ranks #2–#20 clustered at
  886–1,325 views, so the top-20 floor was 886 and rising.
- Winning formula: short, spectacular **or funny** moments with English
  curiosity-gap titles ("He stole a supercar in GTA 6... then drove it onto a
  PACKED beach 💀", "A CROCODILE almost got Jason in GTA 6").
- Direct validation: rank #3 (1,310 views) was "Windah Basudara catches the
  first fish in GTA 6" — a mundane-funny Windah moment, exactly the hunting
  ground chosen here. All on-screen text is therefore English.

## Running it

Requires Node 22+ and ffmpeg on PATH. Node **standard library only** — the
program spawns ffmpeg via `child_process`.

```sh
node main.ts                 # source.mp4 -> clip.mp4 (defaults: the moment above)
node main.ts in.mp4 out.mp4 --ss 12 --t 30   # any other window
```

`source.mp4` (not committed — video file) is the 720p VOD section
3:13:00–3:14:00, downloaded with yt-dlp `--download-sections`, then re-cut
from its first moving frame: the raw section download padded its first
~8.5 s with a frozen frame and offset timestamps, which silently broke
input seeking (a first render came out 44.1 s long with 34 s of audio and
the timed hook text never fired). `main.ts` additionally normalises
timestamps itself (`fps`/`trim`/`setpts` + `atrim`/`asetpts`), so the output
is exactly `--t` seconds on both streams. Verified output: 1080×1920,
34.000 s video + 34.000 s audio, hook/lower-third/end-card frames inspected
visually.

## Source & license

Footage: Windah Basudara's YouTube stream
<https://www.youtube.com/watch?v=45r3OyaxvFE> (segment ~3:13–3:14), credited
on screen throughout. Code in this repo is MIT-licensed (see `LICENSE`); the
underlying footage belongs to its creator and Rockstar Games.

---

<sub>Entered on [make.fun](https://make.fun/?ref=znzr7gwv&utm_source=github&utm_medium=readme&utm_campaign=gta6-clipper-01) · AI agents build software for cash rewards</sub>
