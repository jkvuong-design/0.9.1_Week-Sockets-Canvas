console.log("App script loaded!");

let socket = io();
let canvasBuffer; // Offscreen graphics buffer for persistent drawing

let myUsername = "Guest 🎨"; // Default username
let currentColor = "#FF4B4B"; // Default red

// Store live positions of other connected users: { [id]: { x, y, username, color, lastSeen } }
let remoteCursors = {};

// Helper function called by HTML input box
function updateUsername(name) {
  myUsername = name.trim() !== "" ? name.trim() : "Guest 🎨";
}

// Helper function called by HTML color buttons
function setColor(selectedColor) {
  currentColor = selectedColor;
}

// Helper function called by HTML Export button
function exportImage() {
  saveCanvas(canvasBuffer, "collaborative-drawing", "png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create persistent offscreen drawing layer
  canvasBuffer = createGraphics(windowWidth, windowHeight);
  canvasBuffer.background(255); // White background
}

function draw() {
  // 1. Render persistent drawing layer onto the screen
  image(canvasBuffer, 0, 0);

  let now = millis();

  // 2. Draw live floating cursors for other connected users
  for (let id in remoteCursors) {
    let user = remoteCursors[id];
    // Keep cursor visible for 3 seconds after last movement
    if (now - user.lastSeen < 3000) {
      drawCursorLabel(user.x, user.y, user.username, user.color);
    }
  }

  // 3. Draw live floating cursor for local user
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    drawCursorLabel(mouseX, mouseY, myUsername, currentColor);
  }
}

// Draw temporary floating username tag next to active cursor position
function drawCursorLabel(x, y, name, color) {
  // Small cursor point indicator
  fill(color);
  stroke(255);
  strokeWeight(2);
  ellipse(x, y, 10, 10);

  // Floating text label
  noStroke();
  fill(40);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text(name, x + 10, y - 5);
}

// Triggered when mouse moves across the canvas
function mouseMoved() {
  drawAndBroadcast();
}

function mouseDragged() {
  drawAndBroadcast();
}

function drawAndBroadcast() {
  // Draw circle locally to persistent offscreen buffer ONLY (no text)
  canvasBuffer.noStroke();
  canvasBuffer.fill(currentColor);
  canvasBuffer.ellipse(mouseX, mouseY, 16, 16);

  // Send drawing point & position to server
  let mouseData = {
    id: socket.id,
    x: mouseX,
    y: mouseY,
    color: currentColor,
    username: myUsername
  };

  socket.emit("message", mouseData);
}

// Handle incoming socket events from other users
socket.on("message-share", (data) => {
  // Ignore our own broadcasted messages
  if (data.id === socket.id) return;

  // 1. Draw remote user's point onto persistent buffer ONLY
  canvasBuffer.noStroke();
  canvasBuffer.fill(data.color || "#FF4B4B");
  canvasBuffer.ellipse(data.x, data.y, 16, 16);

  // 2. Update remote user's current cursor position for floating label
  remoteCursors[data.id] = {
    x: data.x,
    y: data.y,
    username: data.username || "Guest 🎨",
    color: data.color || "#FF4B4B",
    lastSeen: millis()
  };
});