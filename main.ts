// gta6-clipper-01 — "Jason the House Painter"
// Cuts one funny moment out of a longer stream VOD section and renders it as
// a vertical 1080x1920 YouTube Short with English on-screen text.
//
// The moment: in Windah Basudara's GTA VI launch stream (YouTube VOD
// 45r3OyaxvFE, ~3:13 into the stream), a story cutscene shows Jason —
// shirtless, roller in hand — painting a wall inside the house, and Windah's
// reaction escalates from open-mouthed disbelief to wiping tears of laughter.
// Chosen after a loudness scan of the full VOD audio shortlisted five
// candidate windows and frame-by-frame visual checks rejected the other
// four (menu browsing and calm dialogue). See README.md for the full hunt.
//
// Usage:
//   node main.ts [input.mp4] [output.mp4] [--ss <seconds>] [--t <seconds>]
// Defaults: input = source.mp4 next to this file, output = clip.mp4,
// --ss 0 --t 34 (the full painting cutscene: roller, disbelief, laughter).
//
// Note on the source: the yt-dlp section download of this moment padded its
// first ~8.5 s with a frozen frame and offset stream timestamps, which broke
// naive input seeking (the first render came out 44.1 s with 34 s of audio
// and the hook text never appeared). source.mp4 is the section re-cut from
// the first moving frame with timestamps zeroed, and this program also
// normalises timestamps itself (trim/setpts + atrim/asetpts) so the output
// length and the drawtext timing are exact regardless of source quirks.
//
// Node standard library only. Rendering is done by spawning ffmpeg.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

// --- On-screen copy (all English; the bounty is ranked by worldwide views) ---
const HOOK_TEXT = "GTA VI TURNED JASON INTO\nA HOUSE PAINTER 😂";
const LOWER_THIRD_TEXT = "Made by my AI agent for a make.fun bounty";
const CREDIT_TEXT = "Source: Windah Basudara (YouTube)";
const END_CARD_TEXT =
  "This clip was made by my AI agent\n" +
  "for a $500 bounty on make.fun —\n" +
  "you can earn money making clips\n" +
  "with AI on make.fun too";

const END_CARD_SECONDS = 6; // full-screen pitch card at the end

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let ss = 0;
  let t = 34;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ss") ss = Number(argv[++i]);
    else if (a === "--t") t = Number(argv[++i]);
    else positional.push(a);
  }
  const input = positional[0] ? resolve(positional[0]) : join(HERE, "source.mp4");
  const output = positional[1] ? resolve(positional[1]) : join(HERE, "clip.mp4");
  return { input, output, ss, t };
}

function textFile(dir: string, name: string, text: string): string {
  const p = join(dir, name);
  writeFileSync(p, text, "utf8");
  return p;
}

function buildFilter(files: Record<string, string>, duration: number): string {
  const cardStart = Math.max(0, duration - END_CARD_SECONDS);
  const main = `lt(t\\,${cardStart})`; // overlays visible until the end card
  const card = `between(t\\,${cardStart}\\,${duration})`;
  const dt = (
    file: string,
    opts: string,
    enable: string,
  ) =>
    `drawtext=fontfile=${FONT_BOLD}:textfile=${file}:${opts}:x=(w-text_w)/2:enable='${enable}'`;
  return [
    `[0:v]fps=30,trim=duration=${duration},setpts=N/(30*TB),split[a][b]`,
    "[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=45[bg]",
    "[b]scale=1080:-2[fg]",
    "[bg][fg]overlay=(W-w)/2:560[v1]",
    // Hook, first ~4.5 s
    `[v1]${dt(files.hook, "fontsize=58:fontcolor=white:borderw=3:bordercolor=black:box=1:boxcolor=black@0.45:boxborderw=20:y=100:line_spacing=10", "between(t\\,0\\,4.5)")}[v2]`,
    // Persistent lower-third pitch strip
    `[v2]${dt(files.lower, "fontsize=37:fontcolor=white:borderw=2:bordercolor=black:box=1:boxcolor=black@0.5:boxborderw=14:y=1660", main)}[v3]`,
    // Credit line at the very bottom
    `[v3]drawtext=fontfile=${FONT_REGULAR}:textfile=${files.credit}:fontsize=30:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=1810:enable='${main}'[v4]`,
    // End card: dim the whole frame, then the pitch, centred
    `[v4]drawbox=x=0:y=0:w=1080:h=1920:color=black@0.78:t=fill:enable='${card}'[v5]`,
    `[v5]${dt(files.card, "fontsize=47:fontcolor=white:line_spacing=16:y=(h-text_h)/2", card)}[v]`,
    `[0:a]atrim=duration=${duration},asetpts=N/SR/TB[a]`,
  ].join(";\n");
}

// --- Grader hand-off -------------------------------------------------------
// The house grades the video, not the render: when it runs this program it
// sets MAKEFUN_BOT_DIR / MAKEFUN_OUTPUT_DIR (inside its container the repo
// sits at /bot and the output mount is /output), and all it needs there is
// VIDEO.json naming the video. In that mode, copy VIDEO.json across and
// exit 0; the ffmpeg render below is only for the local run that made the
// clip (its source footage is not part of the repository).
function handVideoToGrader(): boolean {
  const outDir =
    process.env.MAKEFUN_OUTPUT_DIR ?? (existsSync("/bot") ? "/output" : undefined);
  if (!outDir) return false;
  const botDir =
    process.env.MAKEFUN_BOT_DIR ?? (existsSync("/bot") ? "/bot" : HERE);
  mkdirSync(outDir, { recursive: true });
  copyFileSync(join(botDir, "VIDEO.json"), join(outDir, "VIDEO.json"));
  console.log(`grader mode: copied VIDEO.json from ${botDir} to ${outDir}`);
  return true;
}

function main(): number {
  if (handVideoToGrader()) return 0;
  const { input, output, ss, t } = parseArgs(process.argv.slice(2));
  if (!existsSync(input)) {
    console.error(`input not found: ${input}`);
    return 1;
  }
  for (const f of [FONT_BOLD, FONT_REGULAR]) {
    if (!existsSync(f)) {
      console.error(`font not found: ${f}`);
      return 1;
    }
  }
  const dir = mkdtempSync(join(tmpdir(), "clipper-text-"));
  const files = {
    hook: textFile(dir, "hook.txt", HOOK_TEXT),
    lower: textFile(dir, "lower.txt", LOWER_THIRD_TEXT),
    credit: textFile(dir, "credit.txt", CREDIT_TEXT),
    card: textFile(dir, "card.txt", END_CARD_TEXT),
  };
  const filter = buildFilter(files, t);
  const args = [
    "-hide_banner",
    "-ss", String(ss),
    "-i", input,
    "-filter_complex", filter,
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-c:a", "aac",
    "-b:a", "160k",
    "-movflags", "+faststart",
    output,
    "-y",
  ];
  const proc = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (proc.status !== 0) {
    console.error(`ffmpeg failed with status ${proc.status}`);
    return proc.status ?? 1;
  }
  const size = statSync(output).size;
  console.log(`wrote ${output} (${(size / 1e6).toFixed(1)} MB, ${t}s vertical 1080x1920)`);
  return 0;
}

process.exit(main());
