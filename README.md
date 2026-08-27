# Math Practice for Kids

A fun, interactive web application for children to practice addition and subtraction math problems.

## Features

- **Addition & Subtraction**: Toggle between + and − operators
- **Multiple Difficulty Levels**: Practice with numbers up to 10 or 20
- **Interactive Touchpad**: Click buttons to fill in answers (no keyboard needed!)
- **Smart Problem Generation**: One field is hidden, user must solve for it
- **Progress Tracking**: Track solved problems with visual progress bar
- **Auto-Advance**: New problem loads automatically after 2 seconds on correct answer
- **Audio Feedback**: Beep sounds for correct/incorrect answers
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. Open `index.html` in your web browser
2. Choose your operator (+ or −)
3. Toggle between limit 10 and limit 20 using the checkbox
4. Click numbers on the touchpad to fill in the empty field
5. Check your answer automatically (or click "Check Answer" button)
6. Track your progress in the progress bar

## Testing

### Browser Tests
Open `tests.html` in your browser to run automated tests:
- Addition problem generation (limits 10 and 20)
- Subtraction problem generation (limits 10 and 20)
- Random field selection distribution

Tests run automatically on page load in the browser console.

### Node.js Tests
Run from terminal:
```bash
node math-game-tests.js
```

This runs the same tests using a Node.js test framework and reports pass/fail results.

## Project Structure

```
ai-AdditionWebpage/
├── index.html      # Main application
├── tests.html      # Test suite
├── math-game.js    # Shared logic module
├── AGENTS.md       # Development guidelines
└── css/           # CSS organization (empty)
```

## Development

The project uses a single-source logic architecture:
- `math-game.js` contains all game logic (problem generation, validation, etc.)
- `index.html` contains the UI and event handling
- `tests.html` uses the same `math-game.js` for testing

This ensures the game logic is consistent across the app and tests.

## License

MIT License - Feel free to use and modify for educational purposes!
