# MarkIt Redevelopment Notes

## Current Context

- This repository will use MarkIt as the main behavioral base and ClickDeck as a focused reference for move/drag controls.
- A project-level `CLAUDE.md` now exists at the repo root (created via `/init` at the user's request). The earlier "do not create a project-level `CLAUDE.md`" decision is superseded; keep `CLAUDE.md` as the working-context guide for future Claude sessions.
- Global instruction migration was verified instead of changed:
  - `C:\Users\HELUOO\.claude\CLAUDE.md` exists.
  - `C:\Users\HELUOO\.codex\AGENTS.md` and `C:\Users\HELUOO\.codex\agents.md` already match the Claude file after converting only the title from `# CLAUDE.md` to `# AGENTS.md`.
  - The two Codex global files are identical.
- Key product direction decisions must be saved in this note file, not only remembered in chat.
- For future important forks or tradeoff decisions, ask the user with a choice/input prompt when available instead of only asking in plain chat text.

## Product Direction

- Rebuild from MarkIt, reusing most of its useful capabilities while making the product smaller and clearer.
- Chosen redevelopment route: start a new maintainable TypeScript implementation from scratch and reproduce MarkIt's useful behavior, instead of trying to split or directly modify the unpacked bundled `content.js`.
- Keep MarkIt as the primary reference for annotation, element editing, feedback capture, popup behavior, and extension basics.
- Add ClickDeck-style move controls: component dragging, snapping, alignment guides, and move-task prompt generation.
- Do not preserve MarkIt's Dev Mode / Prototype Mode split. The useful prototype-mode capabilities should become optional evidence or region annotation inside one unified workflow.

## Main Plugin UI

The plugin should start as a floating ball. Clicking it opens the tool list and enters/activates tool workflows.

Required tool list:

1. Annotation
2. Move component
3. Copy text
4. Copy image
5. Clear
6. Settings
7. Undo and back/return controls

Before implementation planning, create an HTML UI mockup that expands all plugin UI states on one page so the user can annotate and critique it.

## Annotation

- Clicking page elements can add annotations.
- An annotation's core model is `target + instruction`.
- Selection granularity should be switchable: default to an intelligent visual component block, with an explicit way to switch to the precise DOM element when needed.
- The user wants to preserve MarkIt's existing ability to directly edit element content and styles.
- Long press / drag should allow region selection and region annotation.
- Region annotations should default to structured text evidence rather than image evidence.
- Manual screenshot/image evidence may exist, but image evidence should not dominate the core flow.

## Move Component

- The move tool is a dedicated button in the expanded tool list.
- In move mode:
  - Single-click selects a component.
  - Long press drags the selected component.
  - The default target granularity is an intelligent visual component block, not necessarily the exact DOM leaf.
  - Movement is a temporary page preview, not a permanent source-code edit.
  - The generated text prompt should describe the intended source-code change.
- Snapping and guides:
  - Default movement uses alignment and snapping.
  - Use ClickDeck as the reference for alignment guide behavior.
  - Snapping references visible elements in the current viewport.
  - Hold `Alt` to disable snapping and free-move.
  - While `Alt` is held, hide/cancel alignment guides.

## Copy Text

- Copy text should produce a complete AI task package.
- It should include annotations, direct text/style edits, region annotations, and move previews.
- The output style should be structured but restrained.
- Borrow the useful parts of ClickDeck's prompt discipline:
  - Page context
  - Operation list
  - Location hints and how to use them
  - Global editing rules
  - Per-operation target, locator, and instruction
- Avoid carrying over MarkIt's excessive output templates and detail levels unless later justified.

## Copy Image

- Copy image should copy only an image, with no extra text.
- The image should be the current visible page screenshot with annotation overlays, selected regions, sequence numbers, and move previews rendered on top.

## Clear

- Clear must require a second confirmation.
- Clear should remove current page annotations, temporary edits, selected regions, and move previews according to the final state model.

## Settings

- Settings should be minimal.
- Do not default to keeping MarkIt's many settings such as dual-mode colors, pin-style variants, output templates, and multiple output detail levels.
- Candidate settings to evaluate later: language, toolbar reset, auto-clear behavior, and possibly shortcut/help visibility.

## Reference Project Research Needed

Before further brainstorming or PRD finalization, dispatch subagents to study the reference projects:

- MarkIt research:
  - Map actual features and user flows.
  - Identify which capabilities are valuable and should be reused.
  - Identify duplicated or low-value logic caused by dual modes, tutorials, output templates, screenshot/export paths, and settings.
  - Summarize the main content-script modules that need to be rebuilt from the bundled `content.js`.
- ClickDeck research:
  - Map move/drag/region-selection behavior.
  - Extract snapping, alignment-guide, region-context, and prompt-output logic worth adapting.
  - Identify which parts are too heavy and should not be copied.

## Next Deliverables

1. Continue brainstorming after reference-project research.
2. Produce a complete PRD for Codex target mode, including what to build, acceptance criteria, and exit criteria.
3. Before entering plan mode, create one HTML page that shows all plugin UI elements and states for user critique.
4. Only after the PRD and UI critique are stable should implementation planning begin.
