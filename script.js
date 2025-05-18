// Min-Max Tree Game with Levels, Timer, and Score and diagonal SVG connectors

const treeContainer = document.getElementById('treeContainer');
const svg = document.getElementById('treeSvgConnector');
const answerInput = document.getElementById('answerInput');
const feedback = document.getElementById('feedback');
const keys = document.querySelectorAll('.key');
const clearKey = document.getElementById('clearKey');
const submitKey = document.getElementById('submitKey');
const newGameBtn = document.getElementById('newGameBtn');
const roundDisplay = document.getElementById('roundDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const timerDisplay = document.getElementById('timerDisplay');

let rootNode = null;
let currentRound = 1;
let score = 0;
let timer = null;
let timeLeft = 0;

// TreeNode class
class TreeNode {
  constructor(type, children = [], value = null) {
    this.type = type; // 'max', 'min', or 'leaf'
    this.children = children;
    this.value = value;
    this.minmaxValue = null;
    this.element = null;
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTree(depth = 2) {
  if (depth === 1) {
    return new TreeNode('leaf', [], getRandomInt(0,9));
  }
  const nodeType = (depth % 2 === 1) ? 'max' : 'min';
  const maxChildren = depth > 4 ? 4 : 3;
  const childCount = getRandomInt(2, maxChildren);
  const children = [];
  for (let i = 0; i < childCount; i++) {
    children.push(generateTree(depth -1));
  }
  return new TreeNode(nodeType, children);
}

function computeMinMax(node) {
  if (node.type === 'leaf') {
    node.minmaxValue = node.value;
    return node.value;
  }
  const childValues = node.children.map(computeMinMax);
  node.minmaxValue = (node.type === 'max') ? Math.max(...childValues) : Math.min(...childValues);
  return node.minmaxValue;
}

function renderTree(root) {
  treeContainer.innerHTML = '';
  treeContainer.appendChild(svg); // append SVG back after clearing

  const levels = [];
  const queue = [{node: root, level: 0}];
  while (queue.length) {
    const {node, level} = queue.shift();
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
    node.children.forEach(child => queue.push({node: child, level: level + 1}));
  }

  levels.forEach(levelNodes => {
    const levelDiv = document.createElement('div');
    levelDiv.classList.add('tree-level');
    levelNodes.forEach(node => {
      const nodeDiv = document.createElement('div');
      nodeDiv.classList.add('node');
      nodeDiv.setAttribute('aria-label', `${node.type} node`);
      if (node.type === 'leaf') {
        nodeDiv.classList.add('leaf');
        nodeDiv.textContent = node.value.toString();
      } else {
        nodeDiv.textContent = `${node.type.toUpperCase()} ?`;
      }
      node.element = nodeDiv;
      levelDiv.appendChild(nodeDiv);
    });
    treeContainer.appendChild(levelDiv);
  });

  drawConnectors(levels);
}

function drawConnectors(levels) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  const containerRect = treeContainer.getBoundingClientRect();
  svg.setAttribute('width', containerRect.width);
  svg.setAttribute('height', containerRect.height);

  for (let lvl = 0; lvl < levels.length - 1; lvl++) {
    levels[lvl].forEach(parent => {
      parent.children.forEach(child => {
        drawSVGConnector(svg, parent.element, child.element, containerRect);
      });
    });
  }
}

function drawSVGConnector(svg, parentEl, childEl, containerRect) {
  if (!parentEl || !childEl) return;

  const parentRect = parentEl.getBoundingClientRect();
  const childRect = childEl.getBoundingClientRect();

  const startX = parentRect.left + parentRect.width/2 - containerRect.left;
  const startY = parentRect.bottom - containerRect.top;
  const endX = childRect.left + childRect.width/2 - containerRect.left;
  const endY = childRect.top - containerRect.top;

  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  const controlX = (startX + endX)/2;
  const controlY = startY + 20;

  const d = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

  path.setAttribute('d', d);
  path.setAttribute('stroke', '#c9a9ff');
  path.setAttribute('stroke-width', 2);
  path.setAttribute('fill', 'none');
  path.setAttribute('opacity', '0.7');

  svg.appendChild(path);
}

function revealTreeValues(node) {
  if (!node || !node.element) return;

  if (node.type !== 'leaf') {
    node.element.textContent = `${node.type.toUpperCase()} ${node.minmaxValue}`;
    node.element.style.backgroundColor = node.type === 'max' ? '#8e44ad' : '#2980b9';
    node.element.style.boxShadow = '0 0 20px #bb88ffaa';
  }
  node.children.forEach(revealTreeValues);
}

function startTimer(seconds) {
  clearInterval(timer);
  timeLeft = seconds;
  timerDisplay.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if(timeLeft <= 0) {
      clearInterval(timer);
      feedback.style.color = '#c0392b';
      feedback.textContent = `Time's up! Game over. You reached round ${currentRound}.`;
      revealTreeValues(rootNode);
      disableInput(true);
      setTimeout(resetGame, 3500);
    }
  }, 1000);
}

function disableInput(disabled) {
  keys.forEach(k => k.disabled = disabled);
  clearKey.disabled = disabled;
  submitKey.disabled = disabled;
  answerInput.disabled = disabled;
}

keys.forEach(key => {
  key.addEventListener('click', () => {
    if(answerInput.disabled) return;
    const val = key.getAttribute('data-value');
    if(val !== null && answerInput.value.length < 3) {
      answerInput.value += val;
      feedback.textContent = '';
    }
  });
});

clearKey.addEventListener('click', () => {
  if(answerInput.disabled) return;
  answerInput.value = '';
  feedback.textContent = '';
});

submitKey.addEventListener('click', () => {
  if(answerInput.disabled) return;
  if(answerInput.value === '') {
    feedback.style.color = '#ffcc00';
    feedback.textContent = 'Please enter a value.';
    return;
  }

  const userAnswer = parseInt(answerInput.value, 10);
  if(userAnswer === rootNode.minmaxValue) {
    clearInterval(timer);
    score += Math.floor(timeLeft * 10 * currentRound);
    scoreDisplay.textContent = score;
    feedback.style.color = '#27ae60';
    feedback.textContent = `Correct! On to round ${currentRound + 1}...`;
    revealTreeValues(rootNode);
    disableInput(true);
    setTimeout(() => {
      currentRound++;
      roundDisplay.textContent = currentRound;
      startRound();
    }, 2800);
  } else {
    clearInterval(timer);
    feedback.style.color = '#c0392b';
    feedback.textContent = `Incorrect! Game over at round ${currentRound}.`;
    revealTreeValues(rootNode);
    disableInput(true);
    setTimeout(resetGame, 3500);
  }
});

function startRound() {
  answerInput.value = '';
  feedback.textContent = '';
  disableInput(false);

  const depth = Math.min(currentRound + 1, 5);
  rootNode = generateTree(depth);
  computeMinMax(rootNode);
  renderTree(rootNode);

  const startSeconds = Math.max(20 + (currentRound - 1) * 20, 10);
  startTimer(startSeconds);
}

function resetGame() {
  currentRound = 1;
  score = 0;
  roundDisplay.textContent = currentRound;
  scoreDisplay.textContent = score;
  feedback.textContent = '';
  disableInput(false);
  startRound();
}

newGameBtn.addEventListener('click', () => {
  clearInterval(timer);
  resetGame();
});

window.addEventListener('load', resetGame);
