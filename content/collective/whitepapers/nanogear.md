---
title: "nanogear game engine"
description: "a dead-easy game engine that integrate with AI directly in editors for one-day mastery and absolute lowest skill requirements"
sidebar_order: 
proposer: "Jason Chiu"
proposer_github: "jason1015-coder"
status: "In public review"
review_opens: "2026-06-10"
review_closes: "2026-07-10"
---

## problem
Editors of game engine are complicated to a extent that even staring at it cause headache, simple engines that godot cannot fully simplify the workflow which for an AI era, costing too much time to learn and use. A ultra-simplification of game engine is required for game development that is truly needed for mass production , and unlimited creativity due to minimum technical restrictions

## principles

-all nano-collective principles( local, privacy-first, full control)
-minimum effort when using the engine, even those who cannot code and design can use and quickly master it

## purposed approach

language: any easy-to-learn language, Go is prefered
GUI: Fyne(for go), or others if end up implementing in different languages
Form: as a desktop app
support platform: ideally macOS, windows and linux(mobile could be considered, like godot support android, but likely rejected due to complexity)
-a language/ forms of config files that is used to define , deploy , write game logic (start with 2D, 3D could be added after)
-physics engine, audio, networking etc as standard build-in libraries that automatically imported, unless indicated as excluded in import files
-a GUI that can be controlled by both human and AI( via commands like /click < button > ; /back ; ) , as simple as possible
-AI agent that control GUl via those command( could base on nanocoder , existing AI agent, that could be modified so it specific to game engine)
-import system that use import files to import extensions directly from github
## v1.0 success picture

-capable of making simple games, like snake, 2048, angry bird / mario/ plant vs zombies clones via both AI , user control and manually writing the nanogear-specific language files





