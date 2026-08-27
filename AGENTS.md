# AGENTS.md

## Project Structure
- `index.html` - Main entrypoint for the math practice web application
- `math-game.js` - Core game logic module (shared between app and tests)
- `tests.html` - Automated test suite for the math game logic (runs in browser)
- `math-game-tests.js` - Comprehensive Node.js unit tests (33 tests)
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
- Operator toggle (+/−) with visual feedback (active state)
- Limit toggle (10/20)
- Progress bar and statistics
- Touchpad buttons populate the currently empty field
- No mobile keyboard triggered (inputs are readonly)

### math-game.js
Shared logic module containing:
- **Core Functions**
  - `MathGame.init(domElements)` - Initialize with DOM references
  - `MathGame.setOperator(operator, operatorSpan)` - Switch between +/−
  - `MathGame.generateNewProblem()` - Generate random problem
  - `MathGame.checkAnswer()` - Validate user's answer
- **Pure Helpers (testable)**
  - `MathGame.evaluateAnswer(val1, val2, answerVal, operator)` - Check answer correctness without DOM
- **Generators**
  - `MathGame.generateAddition(limit)` - Generate valid addition problem
  - `MathGame.generateSubtraction(limit)` - Generate valid subtraction problem
  - `MathGame.getMaxLimit()` - Get current limit (10 or 20)
  - `MathGame.getProblemsSolved()` - Get solved count
  - `MathGame.getTotalProblems()` - Get total attempts count
- **Test Helpers**
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
Comprehensive Node.js unit tests (33 tests) using simple test framework. Tests:
- Addition problem generation (limits 10 and 20)
- Subtraction problem generation (limits 10 and 20)
- Random field selection distribution
- **Pure `evaluateAnswer` logic** - Addition/subtraction correctness, zero as valid answer, missing operands
- **Timer behavior (crash regression)** - Exactly one timer queued, auto-advance produces valid problem, re-entrancy guard
- **Generated problem consistency** - All generated problems are solvable
- **Touchpad interaction** - Renders correct button count, fills first empty field
- **setMaxLimit** - Updates limit and rebuilds touchpad

## Current State
- Active development: Bug fixes and feature improvements
- Tests: 33 Node.js tests + browser tests
- Default: Limit 10 with checkbox unchecked, limit 20 when checkbox checked
- **Recent fixes**:
  - Fixed critical mobile crash (infinite loop in problem generation)
  - Fixed answer evaluation logic for all field positions
  - Timer no longer accumulates on rapid interactions
  - Progress tracking correctly counts attempts vs solved
