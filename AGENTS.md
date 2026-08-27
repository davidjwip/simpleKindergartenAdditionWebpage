# AGENTS.md

## Project Structure
- `index.html` - Main entrypoint for the math practice web application
- `math-game.js` - Core game logic module (shared between app and tests)
- `tests.html` - Automated test suite for the math game logic (runs in browser)
- `math-game-tests.js` - Node.js unit tests
- `css/` - Empty directory for optional CSS organization

## Development Commands
- Open `index.html` in a browser to run the application
- Open `tests.html` in a browser to run automated tests
- Run `node math-game-tests.js` to run Node.js unit tests

## Test Commands
- **Browser tests**: Open `tests.html` in a browser (runs automatically on load)
- **Node.js tests**: Run `node math-game-tests.js` from terminal

## Logic Reference
The application supports:
- Addition and subtraction problems
- Number limits of 10 or 20 (toggleable via checkbox)
- Random problem generation with one missing value
- Progress tracking and visual feedback
- Auto-advance to next problem after 2 seconds on correct answer

## File Descriptions
### index.html
Main application with HTML/CSS/JS bundled. Features:
- Problem display with input fields for A, B, and C (one hidden)
- Touchpad for number selection (1 to current limit)
- Operator toggle (+/−)
- Limit toggle (10/20)
- Progress bar and statistics
- Touchpad buttons populate the currently empty field

### math-game.js
Shared logic module containing:
- `MathGame.init(domElements)` - Initialize with DOM references
- `MathGame.setOperator(operator, operatorSpan)` - Switch between +/−
- `MathGame.generateNewProblem()` - Generate random problem
- `MathGame.checkAnswer()` - Validate user's answer
- `MathGame.generateAddition(limit)` - Generate addition problem
- `MathGame.generateSubtraction(limit)` - Generate subtraction problem
- `MathGame.testAddition(limit, iterations)` - Test addition logic
- `MathGame.testSubtraction(limit, iterations)` - Test subtraction logic
- `MathGame.testRandomField(iterations)` - Test field randomization

### tests.html
Browser-based test suite verifying:
- Addition problem generation (limit 10 and 20)
- Subtraction problem generation (limit 10 and 20)
- Random field selection distribution

Tests run automatically on page load. Open browser console to see results.

### math-game-tests.js
Node.js unit tests using simple test framework. Tests:
- Addition and subtraction problem generation
- Answer validation
- Random field selection distribution

## Current State
- Active development: Bug fixes and feature improvements
- Tests: Both browser and Node.js tests in place
- Default: Limit 10 with checkbox unchecked, limit 20 when checkbox checked
