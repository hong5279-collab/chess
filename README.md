# Chess (Vanilla JavaScript)

A browser-based chess game built with plain HTML, CSS, and JavaScript.

## Live Demo (GitHub Pages)
After enabling GitHub Pages for this repository, your game will be available at:

`https://hong5279-collab.github.io/chess/`

## Features
- Full 8x8 chess board with clickable pieces
- Legal move validation per piece
- Check and checkmate detection
- Stalemate detection
- Castling support (king-side and queen-side)
- En passant support
- Automatic pawn promotion to queen
- Board flip button
- New game reset
- Game mode switch: `P2P` or `Vs Computer`
- Lightweight built-in computer opponent (plays Black)
- Enhanced 3D-style board and piece presentation
- Responsive layout for desktop and mobile

## Tech Stack
- `index.html`
- `style.css`
- `script.js`

No frameworks, no build tools, and no dependencies.

## Run Locally
Because this app is fully static, you can run it in two simple ways:

1. Double-click `index.html` to open it in your browser.
2. Or serve it with a local static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish and Run from GitHub
This project is already pushed to GitHub. To make it directly runnable from GitHub:

1. Open repo settings: `https://github.com/hong5279-collab/chess/settings/pages`
2. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
3. Click **Save**
4. Wait about 1-3 minutes for deployment

Your app URL will be:

`https://hong5279-collab.github.io/chess/`

## Project Structure
```text
.
├── index.html
├── style.css
├── script.js
└── README.md
```

## Notes
- This project focuses on core chess gameplay in the browser.
- Current pawn promotion is auto-promote to queen only.
- `Vs Computer` mode currently controls Black; White is player-controlled.

## License
No license file is included yet. If you want, we can add an MIT license next.
