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

### Node.js Tests (Recommended)
Run from terminal:
```bash
node math-game-tests.js
```

This runs a comprehensive test suite covering:
- Addition problem generation (limits 10 and 20)
- Subtraction problem generation (limits 10 and 20)
- Random field selection distribution
- Answer evaluation logic
- Timer behavior (crash regression tests)
- Touchpad interaction
- And more...

### Browser Tests
Open `tests.html` in your browser to run automated tests:
- Addition problem generation (limits 10 and 20)
- Subtraction problem generation (limits 10 and 20)
- Random field selection distribution

Tests run automatically on page load in the browser console.

## Project Structure

```
ai-AdditionWebpage/
├── index.html       # Main application
├── tests.html       # Browser-based test suite
├── math-game.js     # Shared logic module
├── math-game-tests.js # Node.js unit tests (comprehensive)
├── AGENTS.md        # Development guidelines
└── css/            # CSS organization (empty)
```

## Development

The project uses a single-source logic architecture:
- `math-game.js` contains all game logic (problem generation, validation, etc.)
- `index.html` contains the UI and event handling
- `tests.html` uses the same `math-game.js` for testing
- `math-game-tests.js` provides comprehensive Node.js unit tests

This ensures the game logic is consistent across the app and tests.

## Bug Fixes

### Mobile Crash Fix (v2.0)
Fixed a critical infinite loop bug in `generateNewProblem()` that could cause the page to freeze/crash on mobile. The issue occurred when randomly generating addition problems with the max limit - when `num1` happened to equal the limit, the loop would never terminate. Fixed by reusing the `generateAddition()` helper function which properly handles all edge cases.

### Answer Logic
- Correctly evaluates answers regardless of which field is empty (num1, num2, or answer)
- Properly validates subtraction problems (ensures num1 >= num2 for positive results)
- Correctly handles zero as a valid answer
- Empty fields are properly detected and do not count as attempts

## License

© 2026 David Ip. Created for George and Teddy Ip.
All rights reserved.

For educational use only.
