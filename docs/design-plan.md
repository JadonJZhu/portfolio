# Design plan (redesign 2026-11-02, second and third revisions 2026-11-05)

Working document for the builder. `docs/SPEC.md` section 5 wins on copy, scene order and mechanics; this file decides how it looks and moves. Purpose of the site: a manager at Riot, sent the link with no explanation, sees who Jadon is, what he proposes and what he has built, and wants a conversation. It must still read with the effect switched off.

What changed on 2026-11-05: the title and blurb screens, the ability cards, the HUD health, the year rail, every "or scroll" and all scroll navigation are gone. New: Back and a Map overlay in the top bar, a paged agent select, an auto-playing HUD chat, a vertical timeline on the map that the reader scrolls, and one or two quiet animations per screen.

Third revision, same day: the HUD chat is four lines, each after 3 s of "juhdawn is typing..."; the glitches repeat every 6 to 10 s while the reader stays on a screen; the close map's seven labels are buttons that jump back to their screens.

## The one bold thing

The site plays like a match, and the map is the match. One original map (Tannery Row) carries every scene: agent select zooms out of a room, the buy phase shows the map whole, the camera flies the route into the HUD, the timeline is a straight corridor of the map that the reader walks by scrolling, and the close shows the whole map with the route drawing itself end to end. Everything around the map is quiet: two typefaces, square corners, one red component (the next button), no decoration.

The map keeps only section headings and project names as labels, at their own stops, plus year marks beside the timeline corridor. No room names appear anywhere: on screen, in alt text, in the minimap, in the overlay map or in code-generated thumbnails (see "Map labels").

## 1. Tokens

### Colour

Chrome (all text sits on these, never directly on map floors):

| Token | Hex | Role | Contrast |
| --- | --- | --- | --- |
| `--ground` | `#0F1923` | Page background, scene backgrounds, text on red, overlay panel | ink on it 14.53:1 |
| `--raised` | `#17242F` | Cards (timeline, project, preview, chat, lobby card) | ink 12.93:1, muted 6.23:1, red 4.71:1 |
| `--ink` | `#ECE8E1` | Main text | |
| `--muted` | `#9AA4AD` | Dates, skills lines, page marker, typing indicator, Scroll hint | 7.00:1 on ground, 6.23:1 on raised |
| `--red` | `#FF4655` | Next buttons, links, hover, current position, walked route | 5.29:1 on ground, 4.71:1 on raised; ground text on red 5.29:1 |
| `--line` | `rgba(236, 232, 225, 0.22)` | 1px rules, slot outlines, card borders, bar button frames (decorative only) | |
| `--glow` | `rgba(255, 70, 85, 0.55)` | Next button pulse, preview card glow, hovered callout | |

Button labels on red are always `--ground`, never ink (ink on red is 2.75:1 and fails). Links are `--red`, underlined, hover `--ink`.

One extra colour exists only inside the 0.3 s glitch keyframes: cyan `#2EE6E6` for the split channel. It never rests on screen.

Map (after the reference webp, colour only, the image never ships):

| Token | Hex | Role |
| --- | --- | --- |
| `--surround` | `#E4E1DA` | Solid mass between rooms (top face of walls), and the timeline apron (section 3, Timeline) |
| `--floor` | `#7A7A7A` | Room floors |
| `--floor-2` | `#8C8C8C` | Spawn rooms |
| `--site` | `#989874` | Both sites (olive) |
| `--edge` | `#F4F2EE` | 1px room outlines (non-scaling stroke) |
| wall faces | `#D2CFC8`, `#A6A39E`, `#BDBAB4`, `#B1AEA8` | 3D wall faces by angle (0, 90, -90, other) |
| route | `--red` | Dashed 1px ahead, solid 3px walked, position dot red with 2px ink stroke |

Nothing is red on the map except the route, the position dot and its pulse ring, reached timeline markers, and a hovered or current callout.

### Type

Saira Extra Condensed (700, 800) for display and labels, Barlow (400, 500, 600) for reading. Self-hosted in `assets/fonts`. Sentence case everywhere except the two game words written in capitals, `START` and `LOCK IN`, typed that way in the HTML (no `text-transform` anywhere). Left aligned throughout except the lobby (centred, like a party screen), "Visual Portfolio" in the bar, and button labels.

Root size: `html.fly { font-size: min(100%, 1.778vh, 1.111vw) }`, so 1rem is 16px at 1440x900 and everything scales down on short or narrow screens. Phone (`max-aspect-ratio: 1/1`) uses a 16px root.

| Role | Desktop (1440x900) | Phone (390x844) |
| --- | --- | --- |
| Scene heading (h2: Buy phase, Riot-inspired Projects) | Saira 800, 4.5rem, 0.95 | 2.75rem |
| Agent name "Prototype Engineer" | Saira 800, 6rem, 0.9 | 2.5rem, 0.95 |
| Card title (timeline, project) | Saira 700, 2.5rem, 1.0 (project name 4.5rem 800) | 1.875rem |
| Buy menu item | Saira 700, 2.75rem, 1.0 | 1.75rem |
| Overlay menu item (Lobby, Buy phase, Contact) | Saira 700, 2.25rem, 1.0 | 1.5rem |
| Overlay heading "Map" | Saira 800, 2.75rem, 0.95 | 1.75rem |
| Next button label | Saira 800, 1.75rem, 1.0 | 1.5rem |
| Bar text (Back, heading, Map) | Saira 700, 1.125rem, 1.0 | 1rem |
| "Visual Portfolio" | Saira 800, 1.25rem, 1.0 | 1.125rem |
| Map callout chip | Saira 700, 1.125rem | 0.9375rem |
| HUD timer | Saira 700, 1.75rem, tabular figures | 1.25rem |
| Timeline year marks and year readout | Saira 700, 1rem | 0.8125rem (readout 0.875rem) |
| Agent blurb | Barlow 500, 1.375rem, 1.45, max-width 32em | 1rem, 1.4 |
| Page marker "1 / 2" | Saira 700, 1.125rem, muted | 1rem |
| Body (cards, summaries) | Barlow 400, 1.125rem, 1.45, max-width 34em | 1rem, 1.4 |
| Chat | Barlow 500, 1.0625rem, 1.45; name Barlow 600 red | 0.9375rem, 1.4 |
| Typing indicator | Barlow 500, 0.9375rem, muted | 0.875rem |
| Meta (date, kind, skills, Scroll hint) | Barlow 500, 0.9375rem, 1.35, muted | 0.875rem |

Line length stays under 80 characters: card bodies cap at 34em, the blurb at 32em (about 64 characters at 1.375rem).

### Spacing, borders, corners, layers

- Spacing scale (rem): 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4. Desktop outer gutter 3rem, phone 1rem. Fixed top bar 3rem on both.
- Corners are square everywhere. No border-radius on anything (the HUD minimap too).
- Rules are 1px `--line`. Cards: `--raised` fill plus 1px `--line` border. No drop shadows except the red glow.
- One cut shape only: the lobby player card's bottom chevron (`clip-path: polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)`). The agent grid's filled tile gets a 2px red bottom rule. No other angled cuts.
- z-index (fly mode only): stage 0; `main` 1 (the timeline scroller and its fixed reading-line pieces live inside it); top bar 3. The overlay is a modal `<dialog>` in the browser's top layer and needs no z-index.
- Scrolling: in fly mode `html` and `body` get `overflow: hidden`. The only scrolling box is `#timeline` (section 3, Timeline). The old `.scroll-room` is deleted.

## 2. Top bar (`.bar`, every screen)

One fixed element, 3rem tall, full width, `rgba(15, 25, 35, 0.9)` with a 1px `--line` bottom rule. It is a three-column grid, `grid-template-columns: 1fr auto 1fr`, padding 0 1.5rem (phone 0 1rem), so the centre title is truly centred whatever the left side holds.

1440x900, lobby and any other screen:
```
| Lobby                       Visual Portfolio                  [# Map] |
| [< Back] // Position Overview                                [# Map] |
```
390x844:
```
| Lobby      Visual Portfolio   [# Map] |
| [< Back] // Riot-inspired Pr.. [# Map]|   (fits: about 308 of 358 px)
```

- **Left group** (`display: flex; align-items: center; gap: 0.75rem`): Back button, `//` in muted, then the current heading in Saira 700 ink. Back is `<button class="back" type="button">` with a 1rem chevron (the existing 14x14 path) and the word "Back". On the lobby Back and `//` are `display: none`, so "Lobby" sits at the left edge.
- **Centre**: `<p class="brand">Visual Portfolio</p>`, Saira 800 1.25rem ink, shown on the lobby only (`visibility: hidden` elsewhere, so nothing shifts). It is static (the flicker-on was removed 2026-11-05).
- **Right**: `<button class="map-btn" type="button" aria-haspopup="dialog">` with the existing `assets/icons/map.svg` at 1.125rem (`.ico.i-map`) and the word "Map". `justify-self: end`.
- **Back and Map share one plain frame**: height 2rem, padding 0 0.75rem, gap 0.375rem, transparent fill, 1px `--line` border, ink text. Hover: border and text `--red`. Focus-visible: 3px ink outline, 2px offset (the bar is tight). They never glow.
- **Heading per screen** (from `data-heading`): lobby "Lobby", position "Position Overview", buy "Buy phase", why-riot "Why I love Riot", timeline "Past experiences", projects and the three `p-*` "Riot-inspired Projects", close "Contact". Section headings only, never room names. The text changes when the current screen changes.

| Screen | Back | `//` + heading | Visual Portfolio | Map |
| --- | --- | --- | --- | --- |
| Lobby | hidden | "Lobby" | shown | shown |
| Agent select, blurb 1 | to lobby | shown | hidden | shown |
| Agent select, blurb 2 | to blurb 1 | shown | hidden | shown |
| Buy phase | to agent select (blurb 2) | shown | hidden | shown |
| HUD | to buy phase | shown | hidden | shown |
| Timeline (any scroll) | to HUD | shown | hidden | shown |
| Projects intro | to timeline, last entry | shown | hidden | shown |
| Each project | to previous project or intro | shown | hidden | shown |
| Close | to Callout Drill | shown | hidden | shown |

The bar is hidden on the plain page.

## 3. Scenes

ASCII is to scale in proportion, not in characters. All positions are for the fly state; the plain page is in section 9.

### Lobby (`#lobby`, first screen)

Party screen drawn from scratch: thin outlined slots, one filled card, a big red START. Solid `--ground` background; the stage sits behind it at opacity 0.

1440x900:
```
+--Lobby---------------------Visual Portfolio---------------[# Map]--+
|                                                                    |
| Queue            +----+  +----+  +======+  +----+  +----+          |
| Position         | +  |  | +  |  | face |  | +  |  | +  |          |
| Proposal         |    |  |    |  |    ¤ |  |    |  |    |          |
|                  |    |  |    |  |juhdawn  |    |  |    |          |
|                  |    |  |    |  |#tchno|  |    |  |    |          |
|                  |    |  |    |  |Jadon |  |    |  |    |          |
|                  +----+  +----+  | Zhu  |  +----+  +----+          |
|                                   \    /                           |
|                                    \/                              |
|                           [  START  ]                              |
+--------------------------------------------------------------------+
```
- Queue block: x 3rem, vertically centred. "Queue" in meta style, "Position Proposal" below in Saira 800 2.5rem ink.
- Five slots centred as a row, gap 1.5rem. Empty slots: 11x26rem, 1px `--line` outline, transparent. The "+" moves from the slot background to `.slot::after` (two 1px bars, 1.5rem, centred) so it can pulse on its own (section 7). Slots are `aria-hidden`; each sets `--n` (0 to 3) inline for the stagger.
- Player card (centre): 13.5x30rem, as now. No ready light (removed 2026-11-05).
- START: next button, min-width 20rem, centred, bottom 3rem. No "or scroll".

390x844: as now (queue at y 1rem, card 12.25x25rem, two slots of 3.5rem shown), START centred at bottom 1.5rem.

### Agent select (`#position`)

Full scene over a `--ground` background with the existing radial lift (`radial-gradient(circle at 35% 70%, #1E2F3D, var(--ground) 55%)`, centre moved from 44% to 35% to follow the figure). The page is one screen with two blurbs, shown one at a time.

**Figure sizing, measured.** `assets/me/body.png` is 408x611. Reading its alpha channel with Playwright: the person occupies rows 104 to 610 (507 px, 83.0% of the height; nothing transparent at the bottom) and columns 88 to 320, centred at x 204 (the image centre). So for the visible person to be 70% of the viewport height, the image must be 0.70 / 0.830 = 84.4% of it, bottom anchored:

```css
html.fly .figure { position: absolute; left: 35%; bottom: 0; height: 84.4vh; width: auto; max-width: none; translate: -50% 0; transform-origin: 50% 100%; }
```

The panel is `inset: 3rem 0 0`, so its bottom is the viewport bottom and 35% of its width is 35% of the viewport. Use `vh`, not rem, because rem stops growing at 16px on large screens while the figure must keep growing. Use the `translate` property, not `transform`, so the breathing `scale` (section 7) does not overwrite it. At 1440x900 the image is 760 px tall (1.24x), the person's head top is at y 270 and the person spans x 360 to 649. At 1920x1080 it is 1.49x and a little soft, which is Jadon's call. The person is 32.0vh wide (232/611 x 84.4vh), so its right edge is at `35% + 16vh`.

1440x900, blurb 1:
```
+--[< Back] // Position Overview-------------------------------[# Map]--+
| +-----------------+                                                   |
| | [#] Position    |                       Department TBD              |
| |     Proposal    |                       Prototype Engineer (6rem,   |
| +-----------------+                       wraps to 2 lines if needed) |
| [F][ ][ ][ ]               .--.                                       |
| [ ][ ][ ][ ]              (    )  y 270   1 / 2                       |
| [ ][ ][ ][ ]               \  /           Hi, I'm Jadon, a senior     |
|                          .-'  '-.         studying Applied Mathematics|
|                         /  figure \       at UCLA, ... (1.375rem,     |
|                        |  axis at  |      ~11 lines, x 696 to 1392)  |
|                        |  x 504    |                                  |
|                        |  (35%)    |      [ Next ]                    |
|                        |           |                                  |
+-----------------------------------------------------------------------+
```
1440x900, blurb 2:
```
|                                            2 / 2                     |
|                         figure             I don't list an exact     |
|                                            department ... (blurb 2)  |
|                                                                      |
|                     [   LOCK IN   ]        (no button here)          |
+-----------------------------------------------------------------------+
```

- Ability cards are deleted with their CSS and the icons `find.svg`, `tools.svg`, `prototype.svg`, `handoff.svg` (nothing else uses them; `map.svg` stays for the map label and the Map button).
- Map label block and agent grid: unchanged (x 3rem, y 2rem, 18.75rem wide; grid 4x3 of 4rem tiles at y 8.5rem). They end at x 328 at 1440x900, clear of the person (x 360).
- Right column `.agent`: `position: absolute; left: calc(35% + 16vh + 3rem); right: 3rem; top: 2rem; max-width: 44rem; display: flex; flex-direction: column;` (x 696 to 1392 at 1440x900). Contents in order: "Department TBD" (Barlow 600 1.125rem muted), "Prototype Engineer" (Saira 800 6rem/0.9 ink, may wrap), 1.5rem gap, page marker `<p class="page" aria-hidden="true">1 / 2</p>` (Saira 700 1.125rem muted), 0.75rem gap, the blurbs, 2rem gap, the Next button.
- Blurbs: two `<p class="blurb" tabindex="-1">` stacked in one grid cell (`.blurbs { display: grid } .blurb { grid-area: 1 / 1 }`), so the cell is as tall as the longer blurb and nothing below it moves when the page changes. The hidden one gets `visibility: hidden`. Barlow 500 1.375rem/1.45. About 96 words each, about 11 lines at 696 px, about 350 px tall. Column total at 1440x900 about 700 px, ending near y 810.
- Next (blurb 1 only): `<button class="next page-next" type="button">Next</button>`, the standard next component (min-width 13.75rem). On blurb 2 it gets `visibility: hidden` (space kept).
- LOCK IN (blurb 2 only): `.go` with `left: 35%; bottom: 3rem; translate: -50% 0`, `.next` min-width 17.5rem, over the figure. On blurb 1 it is `visibility: hidden`, so it neither shows nor glows nor takes focus.
- Paging: Next shows blurb 2 (type-in, section 7), sets the marker to "2 / 2", hides Next, shows LOCK IN, and moves focus to blurb 2 (`tabindex="-1"`, `preventScroll`). Back on blurb 2 shows blurb 1 at once (no type-in), marker "1 / 2", Next back, LOCK IN hidden, focus to blurb 1.
- Which blurb on arrival: arriving forward (START, deep link, overlay) shows blurb 1; arriving by Back from the buy phase shows blurb 2 with LOCK IN, the state the reader left.

390x844 (no inner scroll):
```
+[< Back] // Position Overview [# Map]+  y 0 to 48
| Position Proposal       [F][ ][ ][ ]|  y 56 to 92: label 1.25rem, 4 tiles 2.25rem
|+---------+ Department TBD           |  y 112
||  figure | Prototype                |
||  14rem  | Engineer (2.5rem)        |  y 132 to 228
||  tall   |                          |
||         | 1 / 2                    |  y 252
|+---------+                          |  figure y 80 to 304
| Hi, I'm Jadon, a senior studying    |  y 320
| Applied Mathematics at UCLA, ...    |  1rem/1.4, 358 wide,
| (about 15 to 16 lines, 350 px)      |  ends near y 670
|                                     |
|          [   Next   ]  or           |  y 694 to 746 (Next on blurb 1,
|          [ LOCK IN  ]               |  LOCK IN on blurb 2, same slot)
+-------------------------------------+
```
- Figure: `left: 1rem; top: 5rem; height: 14rem; translate: none` (150 px wide; the person's top is about 38 px into the image, so the head starts near y 118). Breathing still applies.
- Name block: `left: 11.25rem; right: 1rem; top: 7rem`, dept 0.9375rem, name 2.5rem/0.95, marker 1rem under it.
- Blurbs: `left: 1rem; right: 1rem; top: 20rem`, 1rem/1.4. At 358 px about 44 characters a line, so about 15 lines (336 px) for blurb 1 and 16 (358 px) for blurb 2, ending by y 678.
- Next and LOCK IN share one slot: centred, bottom 6.125rem (y 694 to 746), 12.5rem wide, 3.25rem tall. On phone LOCK IN moves from under the figure to this slot, because the figure is small and at the top; the reader's eye is at the end of the blurb.
- If a smaller phone cannot fit this, the "screen does not fit" rule keeps the plain page; never shrink the blurb below 1rem.

### Buy phase (`#buy`)

Unchanged layout: menu on the left, the whole map in the square slot on the right, four callout chips on the map, shared preview card. Changes:
- Order: it now comes after agent select. The camera reaches it by pulling out of the agent-select room to the whole map (section 6).
- Callouts and menu items stay clickable but plain: no glow or red until hovered or focused. Start Match is the only glowing element.
- The chips pop in one after another on each arrival (section 7).
- Preview line for Position Overview becomes "I'd love to join Riot Games." (SPEC Copy). The other three stay.
- "or scroll" removed; Start Match sits alone.

1440x900 (unchanged geometry): map square `min(100vh - 6rem, 56vw)` = 804 px at right edge x 1392, top y 72; heading "Buy phase" 4.5rem at y 80; menu items 2.75rem from y 240; Start Match at about y 720. 390x844: map 358 square at y 56, menu below, Start Match at about y 640.

Preview card (shared by the buy phase and the Map overlay): 17.5rem wide (phone 13.75rem), `--raised`, 1px red border, `box-shadow: 0 0 24px var(--glow)`, padding 0.875rem 1rem; title Saira 700 1.375rem, line Barlow 400 0.9375rem muted. Placement as now: right of the chip, flipped left if it would leave the map square; on phone below the chip, or above if no room. Shows on pointer enter and focus, hides on leave and blur, 120ms opacity fade. On touch a tap jumps. The overlay has its own copy of the element (`#preview-map`) so both can exist; the show and place code takes the callout's own `.view` as its frame.

### HUD (`#why-riot`)

The camera arrives at the Why I love Riot room and holds a tilted 3D view (`f = 0.55`), then the HUD fades in over it. The health "100" and its stroke are deleted (markup, CSS and the phone rule).

1440x900:
```
+--[< Back] // Why I love Riot---------------------------------[# Map]--+
|+--------+                    +------+                                 |
||minimap |                    | 1:23 |  timer, counting down           |
||10x10rem|                    +------+                                 |
|+--------+                                                             |
|                       tilted 3D map, walls up                         |
|+-----------------------------------+                                  |
|| juhdawn: I love Riot because it's |  chat grows upward from          |
|| such a holistic company. The games|  its fixed bottom as lines       |
|| are loads of fun ...              |  arrive                          |
|| juhdawn is typing...              |  muted, one line                 |
|+-----------------------------------+                                  |
|[ Continue ]                                                           |
+-----------------------------------------------------------------------+
```
- Minimap: x 1.5rem, top 1rem (inside the panel), 10x10rem, as now. Its position dot pulses (section 7).
- Timer: top centre as now, 6rem plate. Text counts down (below).
- Chat box: x 1.5rem, bottom 7rem, width 35rem, as now. The last child is the typing indicator `<p class="typing" aria-hidden="true">juhdawn is typing...</p>`, Barlow 500 0.9375rem muted, 0.5rem above it. No dots animation of its own; the whole line pulses gently in opacity (section 7).
- Continue: next button at x 1.5rem, bottom 1.5rem, visible and glowing from the moment the HUD shows.

390x844: minimap 6rem top left, timer centred at the top; the right of that row is now empty (health is gone). Chat spans x 1rem to 374, bottom 5.5rem, 0.9375rem/1.4; Continue at bottom 1.25rem.

**Chat auto-play** (JavaScript, a chain of `setTimeout`s):
- Beats are the four lines of `docs/player-section.md`, each its own `<p class="beat">` starting "juhdawn:". Copy stays verbatim.
- On the first arrival the typing indicator shows at once; every 3 s the next line appears below the last, the indicator staying under it. After the fourth line the indicator is set to `display: none` for good.
- A line appears with `display: block` and a 0.25 s fade. The box's bottom is fixed, so it grows upward. All four lines fit at 1440x900 and 390x844 without reaching the minimap or Continue.
- Total 4 x 3 = 12 s. Continue works at any moment. If the reader leaves before the end, the remaining beats keep arriving off screen; on any later arrival everything is already shown (the chat plays once per page load).
- The chat is not a live region; the full text is in the DOM and reaches a screen reader as the beats are shown.

**Timer**: starts at "1:40" on the first arrival and counts down one second at a time (`setInterval` 1000 ms, text `m:ss`), stopping at "0:00" with the interval cleared. It keeps running while the reader is elsewhere; it is decoration and does not restart. `font-variant-numeric: tabular-nums` and the fixed 6rem plate keep it from shifting.

### Timeline (`#timeline`, vertical, on the map)

One section holds the ten entries, oldest first, each `<article class="card" id="t-yanglab">` and so on (ids kept). Section `data-heading="Past experiences"`, a visually hidden `<h2 tabindex="-1">Past experiences</h2>` first. Only the UCLA card has a `.go` Next (to `#projects`); the other nine lose theirs.

**Corridor (from `data/route.json`).** The route's `corridor` is one straight north to south run with one evenly spaced point per entry: as committed for this round, x 85, y 11 to 83, step 8 map units, points 9 to 18. The builder reads x, the first and last y and the step from `SITE_MAP`, never hard-coding them. Markers sit on those points. The route enters the corridor at its north end, so route distance `d` grows southward, and scrolling down (which raises `d`) moves the map up the screen, the same way as the cards.

**Camera on the timeline**: flat (`f = 0`, `bank = 0`), fixed scale, fixed screen x. Scale is set so neighbouring markers are a fixed distance apart on screen:
- `STEP_PX` = 6rem desktop (96 px at 1440x900), 4.5rem phone (72 px).
- `ls = ln(STEP_PX / step)`: 12 px per map unit at 1440x900 (1.49x the buy-phase scale), 9 px per unit on the phone. The whole corridor is 864 px on desktop, so at the first entry the reader sees most of the corridor below the dot.
- Route point at screen x = `CORRIDOR_X` (30vw desktop: 432 px; 3.25rem phone: 52 px) and y = vh / 2 (the reading line). So `ox = vw / 2 - CORRIDOR_X`, `oy = 0`.

**Apron.** At this scale the map's 100 by 100 square does not fill the screen (at x 85 there are only 15 units, 180 px, east of the corridor, and the north end is near the map edge). Add one `<rect class="apron" x="-100" y="-100" width="300" height="300">` in `--surround` as the first child of the floor layer, with the same opacity as the timeline markers (1 on the timeline, fading in and out with them), so the reader sees off-white surround past the map edge instead of the dark page. It is off on the buy and close screens, where the map must read as a bounded square.

1440x900, scrolled so the Silvus card is current:
```
+--[< Back] // Past experiences-----------------------------------[# Map]--+
|            surround / map floors, flat                                   |
|                     :     +--------------------------------------+       |
|               2025 -|     | Jamnesia card (opacity ~0.5)         |       |
|                     ■     +--------------------------------------+       |
|                     |                                                    |
|           +------+  |     +--------------------------------------+       |
|           | 2025 | (●)----| Silvus card, crossing the reading    |       | y 450
|           +------+  |     | line, full opacity                   |       |
|                     ■     |                                      |       |
|                     :     +--------------------------------------+       |
|               2026 -:                                                    |
|                     □     +--------------------------------------+       |
|                     :     | Golotl card (dimmed)                 |       |
|   x: corridor 432   ^     ^ column 512 to 1152 (40rem)           ^       |
+--------------------------------------------------------------------------+
  ● position dot (pulsing)   ■ reached marker   □ marker ahead
  | walked route (solid red)  : route ahead (dashed)
```

390x844:
```
+[< Back] // Past experiences [# Map]+
| :   +----------------------------+ |
| ■   | previous card (dimmed)     | |
| |   +----------------------------+ |
|2025(●)--+------------------------+ |  y 422 reading line
|  |  | current card               | |
|  ■  | 1rem body, 298 px wide     | |
|  :  +----------------------------+ |
|Scroll                              |  only before the first scroll
|  v  +----------------------------+ |
+------------------------------------+
  corridor x 52, column x 76 to 374
```

**Layout of the scroller**
- `html.fly #timeline { position: fixed; inset: 0; overflow-y: auto; overscroll-behavior: contain; pointer-events: auto; scrollbar-width: thin; scrollbar-color: var(--muted) transparent; }` It covers the whole viewport, so the wheel works over the map too; the map is not interactive here. The top bar (z 3) sits over it.
- Card column `.entries`: `margin-left: calc(30vw + 5rem); width: 40rem; display: flex; flex-direction: column; gap: 3rem;` (x 512 to 1152). Phone: `margin-left: 4.75rem; margin-right: 1rem; width: auto; gap: 1.5rem` (x 76 to 374, 298 px).
- Padding so the first and last cards can reach the reading line: `padding-top` = 50vh minus half the first card's height, `padding-bottom` = 50vh minus half the last card's height. Set in JS at init from measured heights (CSS cannot know them).
- Cards: same card component as before (`--raised`, 1px `--line`, padding 1.75rem; phone 1rem), no fixed max-height (the column scrolls). Game art band 15rem desktop, 8.75rem phone.

**Scroll to camera mapping (piecewise linear).** At init, for each card k measure `S_k = card.offsetTop + card.offsetHeight / 2 - vh / 2`: the scroll position at which card k's centre sits on the reading line. With the padding above, `S_0 = 0` and `S_9` is the maximum scroll. On every `scroll` event (passive, one `requestAnimationFrame` per frame):
```
S = timeline.scrollTop
k = largest index with S_k <= S (clamped to 0..8)
u = clamp((S - S_k) / (S_{k+1} - S_k), 0, 1)
d = d_k + (d_{k+1} - d_k) * u          // d_k: route distance of marker k
```
then set the GSAP timeline to the matching time inside the timeline segment (section 6: the segment tweens `state.d` linearly from `d_0` to `d_9`, so `time = segStart + segLen * (d - d_0) / (d_9 - d_0)`) and render. Consequences: when card k's centre is on the reading line, the camera's `d` equals marker k's, so marker k and the dot are exactly level with the card's centre. Between cards the map moves 96 px while the cards move their pitch (half of each card plus 3rem, at least about 300 px), so the map always moves more slowly than the cards, and in the same direction. No snapping, no inertia added, no buttons.

**Pieces fixed on the reading line** (children of `#timeline`, `position: fixed`, `pointer-events: none`, `aria-hidden`):
- Position dot: the existing SVG `.pos` circle, which the camera keeps at (CORRIDOR_X, vh / 2). Plus a pulse ring `.pos-ring`, a second SVG circle at the same point (section 7), visible only on the timeline (same opacity as the markers).
- Reading tick: a 1px `--red` line at `top: 50%`, from `CORRIDOR_X + 0.75rem` to the column's left edge (x 444 to 512 desktop, 64 to 76 phone), opacity 0.7. It ties the dot to the card being read.
- Year readout `.year-now`: a plate right-aligned to `CORRIDOR_X - 1.25rem`, vertically centred on the reading line: `--ground` fill, 1px `--red` border, padding 0.125rem 0.5rem, Saira 700 1rem ink (phone 0.875rem, right edge at 0.25rem left of the dot). Text is the integer year of the interpolated date at `d` (dates `when` interpolated between markers like `d`). It covers a year mark on the map as that mark passes; that is intended, like a gauge needle.
- Scroll hint `.hint`: centred on CORRIDOR_X, top `calc(50% + 2rem)`, "Scroll" in meta style over a 1rem down chevron (SVG, stroke muted 2px). It sits on the map below the dot, never over a card or a year mark. Shown on arrival; at the first `scroll` event with `scrollTop > 4` it fades out (opacity 0 over 0.3 s) and stays gone until the timeline is entered again.

**On the map** (floor layer, in world units computed at init from rem and the timeline scale, so they read at the stated px size):
- Markers: one square per entry, 0.625rem (10 px) on a side, centred on its corridor point. Ahead: `--ground` at 0.4 opacity. Reached (`d >= d_k - 0.01`): `--red` fill, 1.5px ink stroke, with the pop (section 7). Visible only on the timeline, as now.
- Year marks: one per Jan 1 from 2023 to 2027, on the west side of the corridor (the cards are east). Tick: a 1px line in `--ground` at 0.6 opacity from 0.5rem to 1.25rem west of the corridor. Label: Saira 700 1rem (phone 0.8125rem), `text-anchor: end`, right edge 1.75rem west of the corridor (phone 1.25rem), fill `--ground`, 0.25em `--surround` stroke behind (`paint-order: stroke`, the same treatment as the map labels) so it reads on floors and olive. Positions come from `SITE_MAP.years` (each Jan 1 placed between the entries either side of it by date). 2023 comes before the first entry (Nov 2023), so extrapolate it with the first gap's rate (8 units per 1.34 years): 0.83 years above the first marker, y about 6.0. Same visibility rule as the markers.
- The route along the corridor: walked part solid red above the dot, dashed ahead below it, as everywhere. No other text on the map here except the "Past experiences" label near the corridor's top while the camera is near it.

**Cards entering and leaving**: they scroll at page speed; nothing animates them. Each frame, a card that crosses the reading line has opacity 1; any other card has `opacity = max(0.35, 1 - dist / (0.45 * vh))`, where `dist` is the distance from the reading line to the card's nearest edge. Opacity only (no transform), so nothing moves the layout. Links in dimmed cards still work, and a focused card is forced to opacity 1 (`:focus-within`).

**Next**: only in the UCLA card, at its bottom left. It is the timeline's one glowing button, visible as the last card comes up.

**Keyboard**: on arrival focus goes to the hidden h2 inside the scroller (`preventScroll`), so arrow keys, Page Down and Space scroll it natively. Tabbing to a link in a far card scrolls it into view, and the scroll handler moves the camera.

### Projects intro (`#projects`)

At its room on the map. Card on the right as now (x 760 to 1392 desktop, bottom anchored on phone): "Riot-inspired Projects" Saira 800 4.5rem, "Here are three Riot-inspired projects I've made." Barlow 500 1.625rem, Next. No "or scroll".

### Project room card (`#p-*`)

As now (card x 352 to 1392, y 104 to 846 desktop; phone x 16 to 374 from y 56), with:
- Summary text replaced verbatim from SPEC Copy (the "Proof-of-concept:" sentences). They are shorter than the old ones, so the column has more air; do not enlarge type to fill it.
- The screenshot wrapped in `<span class="shot">` (`position: relative; display: block; overflow: hidden`) to carry the scan line (section 7). Its alt text stays as written (no room names; Callout Drill's own callouts in the screenshot image are that project's content).
- The project name `h3` glitches on arrival and again every 6 to 10 s (section 7).

### Close (`#close`)

Layout as now: availability line, email, links row on the left, whole map on the right. Bar heading "Contact". The map's labels are the overlay's chips (built by the same code into a `.chips` nav with `#preview-close`): the four section callouts with their preview cards, plus the three project names as chips with no preview. Each is a link that cuts to its screen, like an overlay jump. While the close is current the world labels are hidden so they do not double up; on the plain page the static thumbnail stays. The route draws itself round the whole map on arrival (section 7); the email has a blinking caret after it. No next button.

## 4. Map overlay (`<dialog class="map-dialog">`)

The table of contents. Opened by the Map button with `showModal()`, so the page behind is inert and focus stays inside natively.

Markup order (also the Tab order): header (`<h2>Map</h2>`, Close button), the map `.view` (static SVG plan plus four chip buttons plus `#preview-map`), the list `<nav aria-label="Other screens">` with three buttons: Lobby, Buy phase, Contact. Close is first, so `showModal()` focuses it (focusing a chip first would pop its preview at once).

1440x900:
```
+------------------------------------------------------------------------+
| page, dimmed: ::backdrop rgba(15, 25, 35, 0.82)                        |
|       +===red 3px top rule============================================+ |
|       | +--------------------------------------+  Map         [Close]| |
|       | |                                      |                      | |
|       | |  whole map, 44rem square             |  Lobby               | |
|       | |  [Riot-inspired Projects]            |  ------------------  | |
|       | |            [Past experiences]        |  Buy phase           | |
|       | |   [Why I love Riot]  +preview+       |  ------------------  | |
|       | |                      +-------+       |  Contact             | |
|       | |        (●) you are here              |  ------------------  | |
|       | |   [Position Overview]                |                      | |
|       | +--------------------------------------+                      | |
|       +---------------------------------------------------------------+ |
+------------------------------------------------------------------------+
```
- Dialog: `margin: auto; padding: 2rem; border: 1px solid var(--line); border-top: 3px solid var(--red); background: var(--ground); color: var(--ink); max-width: none; max-height: none;` Grid: `grid-template-columns: 44rem 21.5rem; grid-template-rows: auto 1fr; column-gap: 2.5rem;` map in column 1 spanning both rows, header and list in column 2. Size 72x48rem (1152x768 at 1440x900, top-left at 144, 66).
- Map: a code-built SVG (`viewBox="0 0 100 100"`): surround rect, room paths (the same `rooms` string the minimap uses), the dashed route, the route walked up to the current screen in solid red, and a red "you are here" dot (r 1.6, ink stroke) at the current screen's route point. No text. Chips are the four buy-phase callouts, built by the same function, as `<button>`s positioned in % on the square.
- Header: "Map" Saira 800 2.75rem, left; Close at the right end, the bar button frame (2rem tall, 1px `--line`, "Close" plus a 0.875rem x made of two 1px strokes).
- List: starts 2rem below the header. Three buttons, full column width, each 3.5rem tall, left aligned, Saira 700 2.25rem ink, transparent, 1px `--line` bottom rule. Hover and focus: text `--red`. Not numbered: they are not a sequence.
- Nothing in the overlay glows; it is navigation, not the next step.

390x844:
```
+------------------------------------+
| Map                       [Close]  |  y 16 to 48
| +--------------------------------+ |
| |                                | |
| |  map 358 square, 4 chips       | |  y 64 to 422
| |  preview inside the square     | |
| |                                | |
| +--------------------------------+ |
| Lobby                              |  y 446, rows 3rem
| ---------------------------------- |
| Buy phase                          |
| ---------------------------------- |
| Contact                            |  ends y 590
+------------------------------------+
```
- Phone dialog fills the viewport: `inset: 0; width: 100%; height: 100%; margin: 0; padding: 1rem; border: 0; border-top: 3px solid var(--red)`; one column (`display: flex; flex-direction: column; gap: 1rem`). Heading 1.75rem, list items 1.5rem in 3rem rows, chips 0.9375rem.

Behaviour:
- Open: dialog opacity 0 to 1 over 0.15 s (`dialog[open] { animation: fade-in 0.15s ease-out }`), then the chips pop in (section 7). The "you are here" dot and walked route update to the current screen just before `showModal()`.
- Esc (native `cancel`), the Close button, or a click on the backdrop (`click` whose target is the dialog itself) closes it. On close the browser returns focus to the Map button.
- Choosing a chip or a list button: close the dialog, then jump (a cut, section 6) to that screen; focus goes to the destination's heading, not back to the Map button. Lobby goes to `#lobby`, Buy phase to `#buy`, Contact to `#close`; the chip "Past experiences" goes to the timeline's first entry.
- Hover and focus on a chip show `#preview-map` exactly as in the buy phase; on touch a tap jumps.

## 5. Next button (one component, `.next`)

- Markup: `<a class="next" href="#<next id>">LABEL</a>` inside `<p class="go">`, except the agent-select page button, which is a `<button type="button">` because it does not leave the screen. No `.or` span anywhere (delete the markup and CSS).
- Box: `--red` fill, `--ground` label, Saira 800 1.75rem (phone 1.5rem), padding 0 2rem, height 4rem (phone 3.25rem), min-width 13.75rem (phone 12.5rem), square corners, `outline: 1px solid var(--red); outline-offset: 4px` for the framed client look.
- Hover: fill `--ink`. Active: `translate: 0 1px`. Focus-visible: 3px ink outline.
- Glow: `.next::after` with `box-shadow: 0 0 28px 6px var(--glow)`, opacity pulsed (section 7). A hidden next button is `visibility: hidden`, so its glow is hidden too; that is how "one glowing button" is kept.
- Labels and targets, in the new order: lobby START to `#position`; agent select "Next" (page), then LOCK IN to `#buy`; buy Start Match to `#why-riot`; HUD Continue to `#timeline`; UCLA card Next to `#projects`; projects intro and each project Next to the following one; Callout Drill Next to `#close`. Close has none.

### One glowing button per screen

| Screen | The one glowing element | Plain or hidden |
| --- | --- | --- |
| Lobby | START | Map (plain) |
| Agent select, blurb 1 | Next under the blurb | LOCK IN hidden; Back, Map plain |
| Agent select, blurb 2 | LOCK IN under the figure | page Next hidden |
| Buy phase | Start Match | menu items and chips plain until hovered or focused |
| HUD | Continue | |
| Timeline | Next in the UCLA card (seen when the last card is up) | links in cards are ordinary red links |
| Projects intro, each project | Next | demo and code links are ordinary links |
| Close | none | |
| Map overlay | none | |

## 6. Navigation and motion

### Engine

One GSAP timeline `tl`, as now, built once per layout, with no ScrollTrigger: delete `vendor/gsap/ScrollTrigger.min.js` from the page, the scrub, the snaps, `flySnaps`, `.scroll-room` and the wheel and touch listeners that cancelled glides. `arrive[i]` is the time each screen is reached. Moving is `gsap.to(tl, { time: arrive[j], duration, ease: 'power1.inOut' })`, the existing glide, played forward or backward; `duration = clamp(|Δtime| x 0.7, 0.6, 2.4)` seconds. A new move kills the current one first.

`state` keeps `d`, `ox`, `oy`, `ls`, `f`, `bank`. Helpers stay as now: `travel(a, b)` (route fly with scale out and in, tilt up and down, bank; short hops tilt to 0.35 and scale out only 1.3x), the scene enter (zoom past the room by `ln 2.4` over 1.0 unit, then scene `autoAlpha` 0 to 1 with `scale` 1.04 to 1 over the last 0.35, `power2.out`), and the scene exit (scene fades over 0.3 while `ls` returns to the room scale over 0.5, `power2.out`). One transition style everywhere; Back is the same move played in reverse, which the timeline gives for free.

The timeline screen adds one segment: from `arrive[timeline]` (camera at `d_0`), a linear tween of `state.d` from `d_0` to `d_9` (ease none, duration 1.5 units, nothing else changes), ending at `leave[timeline]`. Scrolling sets `tl.time()` inside this segment (section 3). Forward from the timeline starts at `leave`; back from it starts at the current scrolled time.

### Forward and back, pair by pair

| Pair | Forward (next button) | Back |
| --- | --- | --- |
| Lobby to agent select | Lobby fades over 0.3. Stage opacity 0 to 1 over the first half of the travel. Camera from the whole-map framing at spawn: `travel` to the agent-select room, then the scene enter (zoom into the room, crossfade to the scene). Agent select opens on blurb 1. | Reverse: scene fades and the camera pulls back out of the room, travels back to spawn, stage fades to 0, lobby fades in. |
| Blurb 1 to blurb 2 | No camera. Blurb 1 hidden, blurb 2 types in, LOCK IN appears. | Blurb 1 shown at once. |
| Agent select to buy phase | Scene exit (fade, zoom back out of the room), then the camera pulls out to the whole-map framing in the buy slot. Agent select and the buy phase share a route point, so this is a pure pull-back (`travel` with distance under 1: scale and offsets ease together, `power2.inOut`). Menu and map fade in over the last 0.3; chips pop. | Reverse: buy fades, camera pushes into the room, the scene takes over, showing blurb 2 with LOCK IN. |
| Buy phase to HUD | Menu and chips fade over 0.2; `travel` from the agent-select point to the HUD room, settling with `f = 0.55` (tilted world held); HUD fades in over the last 0.35 with no scale. | Reverse. The chat and timer are left as they are. |
| HUD to timeline | HUD fades over 0.25; `travel` to the corridor's north end (`d_0`), ending flat (`f = 0`) at the timeline scale with the route point at (CORRIDOR_X, vh / 2). The scroller is set to `scrollTop = 0` before it fades in over the last 0.35; markers, year marks, apron, pulse ring, readout and Scroll hint fade in with it. | From any scroll position: first the scroller and its fixed pieces fade out over 0.2 s (a separate tween, not in `tl`), then the glide plays `tl` back from the current time, up the corridor to `d_0` and on to the HUD room. |
| Timeline to projects intro | From `leave` (UCLA card on the reading line): scroller fades over 0.3; markers, years and apron fade with it; `travel` to the projects room; card fades in. | Before the glide starts, set `scrollTop = S_9` (UCLA on the reading line, its Next showing); then play back: card fades, camera returns to `d_9`, scroller fades in. |
| Projects intro to project, project to project | `travel` to the next room, card swap (outgoing fades over 0.16 of the move at its start, incoming over 0.16 at its end). Project name glitches on arrival. | Reverse. |
| Callout Drill to close | Card fades; camera pulls out to the whole map in the close slot along the route back; close text fades in over the last 0.3; then the route draws itself. | Reverse; the drawn route resets to the camera's walked route. |

### Jumps (cuts)

Overlay choices, chips and deep links (`#position`, `#t-silvus`, `#p-callout-drill` and so on) never fly: they set `tl.time(arrive[i])` and render in one frame, after closing the dialog. Screen state is set to the forward arrival state: agent select on blurb 1, buy chips pop, the HUD chat starts if it has not, the timeline at `scrollTop = 0`, or for a deep link to an entry `#t-k`, `scrollTop = S_k` with the matching time. History uses `replaceState` with the screen's id (for an entry, its own id).

### What does not move

Text inside cards and panels, the bar, the overlay layout. Cards only fade or (in the timeline) scroll natively. No hover transitions other than colour and the existing preview fade.

## 7. Animations

All are CSS keyframes except the three that depend on content or time (blurb type-in, chat, timer) and the close route draw, which reuse the existing render path. Every keyframe animates only `opacity`, `scale`, `translate`, or `text-shadow` for 0.3 s, so none changes layout, and none sits over text except the faint scan line on a screenshot image. Each runs only in fly mode (`html.fly`), and the SPEC's reduced-motion rule already serves the plain page there; as a belt and braces rule:

```css
@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation: none !important; transition: none !important; } }
```

and the script starts no timers (type-in, chat, timer, route draw) unless it is in fly mode. Animations tied to arrival are started by a class the script adds when the screen becomes current (`.here` on the section) and removes when it stops being current, so they replay on each arrival.

Shared keyframes:
```css
@keyframes pulse   { 0%, 100% { opacity: 0.25 } 50% { opacity: 1 } }                  /* next button glow */
@keyframes blink   { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
@keyframes breathe { from { scale: 1 } to { scale: 1.01 } }
@keyframes pop-in  { 0% { opacity: 0; scale: 0.6 } 70% { opacity: 1; scale: 1.08 } 100% { opacity: 1; scale: 1 } }
@keyframes pop     { 0%, 100% { scale: 1 } 40% { scale: 1.8 } }
@keyframes ring    { from { opacity: 0.8; scale: 1 } to { opacity: 0; scale: 2.6 } }
@keyframes glitch  {
  0%   { text-shadow: none; translate: 0 }
  15%  { text-shadow: -0.05em 0 var(--red), 0.05em 0 #2EE6E6; translate: -2px 0 }
  35%  { text-shadow: 0.04em 0 var(--red), -0.04em 0 #2EE6E6; translate: 2px 0 }
  60%  { text-shadow: -0.02em 0 var(--red), 0.02em 0 #2EE6E6; translate: -1px 0 }
  100% { text-shadow: none; translate: 0 }
}
```

| Screen | Animation | Keyframes and timing |
| --- | --- | --- |
| All | Next button glow | `.next::after { animation: pulse 2.4s ease-in-out infinite }`, opacity 0.25 to 1. |
| Lobby | The "+" in the empty slots pulse in turn | `.slot::after { animation: queue 2.4s ease-in-out infinite; animation-delay: calc(var(--n) * 0.3s) }` with `@keyframes queue { 0%, 60%, 100% { opacity: 0.2 } 30% { opacity: 1 } }`. A wave left to right, period 2.4 s, peak 1, rest 0.2. |
| Agent select | "Prototype Engineer" glitches on opening, then every 6 to 10 s | `.glitch { animation: glitch 0.3s steps(1, end) 0.15s both }` (red and cyan split up to 0.05em, jitter up to 2px, then clean). Script: on arrival `glitch()` adds the class to the screen's target (`.name`, `#projects h2` or `.project h3`), then one timer re-adds it (remove, reflow, add) at a random 6 to 10 s gap. Any move clears the timer, so it never fires in flight and stops when the screen is left. The projects intro heading and project names use the same rule. |
| Agent select | Figure breathes | `.figure { animation: breathe 2.5s ease-in-out infinite alternate }`: scale 1 to 1.01 from the bottom centre, a full breath every 5 s. |
| Agent select | Each blurb types in fast | Script: split the blurb's text into a typed span and an untyped span with `visibility: hidden` (same text run, so line breaks never change), advancing by `requestAnimationFrame` at a fixed rate so the whole blurb takes 0.9 s (about 700 characters a second), linear. When done, restore the plain text node. Blurb 1 types on each forward arrival, blurb 2 when Next is pressed; going Back shows a blurb at once. A click on the blurb finishes it. |
| Buy phase | Callouts pop in one after another | `#buy.here .chip { animation: pop-in 0.32s ease-out both; animation-delay: calc(0.15s + var(--n) * 0.09s) }`, `--n` 0 to 3 set inline in map order. Chips are `opacity: 0` before `.here` lands. The chip's centring `transform` stays; the animation uses the separate `scale` property. |
| HUD | Chat lines arrive with "juhdawn is typing..." | Script timing in section 3 (a line every 3 s, the indicator showing before each). Beat fade: `transition: opacity 0.25s ease-out`. Indicator: `.typing { animation: pulse 1.2s ease-in-out infinite }` (opacity 0.25 to 1). |
| HUD | Timer counts down from 1:40, stops at 0:00 | Script, 1 s steps, no easing. |
| HUD | Minimap position dot pulses | `.mini circle { transform-box: fill-box; transform-origin: center; animation: breathe-dot 0.8s ease-in-out infinite alternate }` with `@keyframes breathe-dot { to { scale: 1.4 } }`: a 1.6 s cycle. |
| Timeline | Position dot pulses | `.pos-ring` (SVG circle, same centre and radius as `.pos`, no fill, 2px red non-scaling stroke): `transform-box: fill-box; transform-origin: center; animation: ring 1.6s ease-out infinite`. Opacity tied to the timeline like the markers. |
| Timeline | Each marker pops as the dot passes it | When a marker gains `.on` (`d >= d_k - 0.01`): `.marks rect.on { transform-box: fill-box; transform-origin: center; animation: pop 0.3s ease-out }`, scale 1 to 1.8 to 1. Losing `.on` (scrolling back) does not animate. |
| Timeline | Year readout ticks as the reader scrolls | When the integer year changes, the script replaces the plate's inner span and adds `.up` or `.down`: `@keyframes tick-up { from { opacity: 0.2; translate: 0 0.5em } to { opacity: 1; translate: 0 } }`, `tick-down` the same from `-0.5em`; 0.22 s ease-out. The plate does not move; `overflow: hidden` clips the span. |
| Timeline | Scroll hint (not in the SPEC table, part of the hint) | Chevron only: `@keyframes nudge { to { translate: 0 0.375rem } }`, 0.6 s ease-in-out infinite alternate. The hint fades out on the first scroll (0.3 s transition). |
| Projects | A faint scan line sweeps the screenshot | `.shot::after { content: ""; position: absolute; inset: 0; background: linear-gradient(transparent 0 46%, rgba(236, 232, 225, 0.08) 50%, transparent 54%); translate: 0 -100%; animation: scan 5.6s linear infinite; pointer-events: none }`, `@keyframes scan { 0% { translate: 0 -55% } 30%, 100% { translate: 0 55% } }`: a 4%-tall band at 8% white crosses the image in 1.7 s, then 3.9 s of rest. |
| Projects | The project name glitches on arrival and every 6 to 10 s after | The `.glitch` rule and timer above. |
| Close | Blinking caret after the email | `.email::after { content: ""; display: inline-block; width: 0.08em; height: 0.85em; margin-left: 0.12em; background: var(--red); vertical-align: -0.05em; animation: blink 1.1s steps(1, end) infinite }`. The caret is always in the layout; only its opacity changes. |
| Close | The route draws itself round the whole map | Script: on arrival, a GSAP tween of a local `drawn` value from 0 to the route length over 2.4 s, `power1.inOut`, setting `.route-done` to `walkedTo(drawn)` each frame (the existing helper; no dash tricks, which fight `non-scaling-stroke`). Plays once per arrival; leaving restores the camera-driven walked route. |
| Close | The map's seven chips pop in | Same `pop-in` and stagger as the buy phase (`#close.here .chip`). |
| Map overlay | Callouts pop in one after another on open | Same `pop-in` and stagger as the buy phase, started by a class on the dialog when it opens. |

Under software rendering (about 8 fps here) all of these still read; none needs a smooth frame rate to make sense.

## 8. Route and stops (`data/route.json`)

The data file is the source of truth and is being reworked in parallel for the vertical corridor; this table describes the shape the design depends on, as committed for this round. Room names exist only in data and build checks; none reaches the screen or `src/map-data.js`.

| Screen | Route point | Camera |
| --- | --- | --- |
| Lobby | spawn | whole-map framing (the buy slot), stage hidden |
| Agent select | the A Lobby point (30, 85) | the room, zoomed in, then the scene |
| Buy phase | same point as agent select | whole map in the buy slot, flat; walked route from spawn to here |
| HUD | the A Main point (11, 58) | tilted, `f = 0.55`, room scale |
| Timeline | corridor x 85, y 11 to 83 in steps of 8 (points 9 to 18), oldest at the top | flat, timeline scale, point at (CORRIDOR_X, vh / 2) |
| Projects intro and the three projects | after the corridor's south end, in their rooms | card beside the point, as now |
| Close | the route's end | whole map in the close slot, route drawn in full |

Rules the builder keeps: every route segment stays on floor (checked by `build-map.mjs`); the corridor is straight and evenly spaced with entries in date order (checked); the year marks come from the build. Map labels sit at their own stops (table in `route.json`), and the callouts are the four section headings.

## 9. Map labels

- Only these labels exist on the map: "Position Overview", "Why I love Riot", "Past experiences", "Riot-inspired Projects", the three project names, and the year marks 2023 to 2027 beside the timeline corridor (timeline only). Spawn is an unlabelled red dot.
- No room names anywhere: on screen, in the minimap, in the overlay map, in alt text, in `<title>`s, in thumbnails, in `src/map-data.js`.
- The four section headings are interactive chips in the buy phase and in the overlay. Elsewhere they are world labels: SVG text in the top layer, Saira 700, sized to read at about 15px at buy scale, ground fill with a surround stroke, fading as the camera closes in except near their own stop (the current rule).

## 10. Accessibility, reduced motion and the plain page

- Focus order: bar (Back, Map), then the current screen's content in DOM order. Hidden screens are `visibility: hidden` and so out of the Tab order; so are the hidden page Next and LOCK IN.
- Arrival moves focus to the screen's heading (`tabindex="-1"`, `preventScroll`), as now; the agent-select page change moves it to the shown blurb; the overlay is described in section 4.
- Visible focus everywhere: 3px ink outline (4px offset; 2px in the bar).
- Decorative pieces are `aria-hidden`: slots, grid tiles 2 to 12, minimap, timer, typing indicator, page marker, reading-line pieces, year marks, markers, icons.
- Reduced motion and no JavaScript: the same plain vertical document, read by scrolling. It still looks designed:
  - `--ground` page, sections in order with 4rem padding, max-width 68rem, a 1px `--line` rule between sections. No bar, no Back, no Map, no overlay.
  - Lobby: the player card. Agent select: name block, figure at 20rem tall, both blurbs one after the other (no page marker, no page Next). Buy: menu, static thumbnail, preview lines not shown. HUD: the chat with every line, no typing indicator, no timer. Timeline: the ten cards as a vertical list with a 1px left rule, each with its Next removed except UCLA's, which links to `#projects`. Projects and close as cards.
  - Map thumbnails from `build-map.mjs` (12rem square, phone 8rem) on agent select, the HUD, the timeline, projects and close: walked route and stop dot, no text.
  - Next buttons are normal anchors with the red fill and no pulse.
- If any screen does not fit the viewport at load (the measurement in `init()`, now including agent select with the taller of the two blurbs, and the overlay at its size), the page stays plain. The timeline is exempt from the fit check because it scrolls by design; check only that its column fits the width.

## 11. Check against the skill's generic defaults

| Default | Verdict |
| --- | --- |
| Cream, serif, terracotta | Not used. |
| Near-black with one bright accent | The brief pins `#0F1923` and `#FF4655`. What keeps it from the default: the grey, off-white and olive map carries as much area as the dark chrome, and red is rationed to one job (go here, you are here). |
| Broadsheet hairlines and dense columns | Hairlines only where a game client has them (slot outlines, card edges, the overlay list). |
| SaaS card kit | Cards exist because a game client uses panels, but they are square, flat, shadowless and sit on the map, one shape reused. |
| Tracked caps eyebrows, middle dots, mono labels, arrows on links | None. The breadcrumb `//` is the one separator. The page marker "1 / 2" is a real count. |
| Numbered markers | Only the buy menu (1 to 4, the real play order) and the page marker. The overlay list is not numbered. |
| Fade-and-slide entrances everywhere | None. Arrival motion is camera motion, a crossfade, the chip pop, or a one-off glitch; the timeline cards scroll and dim, they do not slide in. |
| Accent on one headline word | Not used. |

## 12. Rejected options

- Room names on the map, even small or on hover: only section headings label the map.
- Copying the VALORANT client closely (gradient banners, agent art, role icons, its font, a currency bar): legal risk and reads as fan art. Kept only layout ideas: party slots, a breadcrumb back button, agent grid plus figure, chat bottom left.
- A second accent colour: red already means "next" and "you are here". Cyan appears only inside the 0.3 s glitch.
- Fixing each timeline card to its marker on the map: ten cards need a corridor about 350 map units long at a readable zoom (SPEC decision log). The card column scrolls and the map follows.
- Snapping the timeline to each card: the SPEC asks for smooth scrolling with no snapping; the dim-by-distance rule shows which card is current instead.
- A horizontal year rail kept alongside the vertical one: two timelines saying the same thing.
- Year marks on the east side of the corridor: they would sit under the cards.
- An HTML overlay of the map (not a `<dialog>`): would need its own focus trap and Esc handling; `showModal()` gives both.
- Overlay chips as links that fly the camera from wherever the reader is: long flights across the map; the SPEC asks for cuts.
- Replaying the HUD chat on every arrival: makes a returning reader wait for text they have read.
- A ticking timer that restarts on each arrival: more state for no information.
- Typing the blurb by inserting characters into the flow: reflows lines every frame. The hidden-remainder span keeps the layout fixed.
- `box-shadow` keyframes on the button: repaints every frame under software rendering; opacity on a pseudo-element is cheap.
- Lenis, ScrollTrigger or WebGL: the timeline's own scroll listener and the CSS 3D world are enough.
