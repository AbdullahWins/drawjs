const fs = require("fs");

// Function to calculate the prize based on matching numbers
function calculateChancePrize(matches) {
  switch (matches) {
    case 2:
      return 100; // 2 correct numbers
    case 1:
      return 10; // 1 correct number
    default:
      return 0; // no prize
  }
}

// Function to simulate the game
function simulateGame(ticketNumbers, totalSales, productPrice) {
  const prizeThreshold = totalSales * 0.15; // Maximum allowed prize (15% of sales)
  const minPrizeThreshold = totalSales * 0.1; // Minimum allowed prize (10% of sales)

  let totalPrizeDistributed = 0;
  let winners = [];
  let winningNumber = generateWinningTicket(ticketNumbers);

  // Calculate prize distribution
  winners = ticketNumbers.map((ticket) => {
    const matches = countMatchingSlots(ticket, winningNumber); // Count how many slots match
    const prize = calculateChancePrize(matches);
    return { ticket, matches, prize };
  });

  // Filter out winners with zero prize
  winners = winners.filter((winner) => winner.prize > 0);

  // Sort winners by prize in descending order
  winners.sort((a, b) => b.prize - a.prize);

  // Calculate total prize distributed from non-zero prize winners
  totalPrizeDistributed = winners.reduce(
    (sum, winner) => sum + winner.prize,
    0
  );

  // Check if the total prize is within the acceptable range
  if (
    totalPrizeDistributed >= minPrizeThreshold &&
    totalPrizeDistributed <= prizeThreshold
  ) {
    return { winningNumber, totalPrizeDistributed, winners };
  } else {
    // If the prize distribution is not within the range, consider revising the winners
    console.log("Prize distribution not within acceptable range");
    return {
      winningNumber,
      totalPrizeDistributed,
      winners: [],
      threshold: `Minimum: ${minPrizeThreshold}, Maximum: ${prizeThreshold}`,
    };
  }
}

// Function to count matching numbers regardless of position
function countMatchingSlots(ticket, winningNumber) {
  const ticketSet = new Set(ticket);
  const winningSet = new Set(winningNumber);
  let matches = 0;

  // Count matches based on the intersection of sets
  winningSet.forEach((number) => {
    if (ticketSet.has(number)) {
      matches++;
    }
  });

  return matches;
}

// Function to generate a winning ticket
function generateWinningTicket(ticketNumbers) {
  // Create a random winning ticket by randomly selecting numbers
  const winningTicket = [];
  for (let i = 0; i < 6; i++) {
    const slot = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    winningTicket.push(slot);
  }
  return winningTicket;
}

// Function to read tickets from a text file
function readTicketsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  // Parse the content to extract ticket numbers
  const tickets = eval(fileContent); // Unsafe, ideally use JSON.parse after proper formatting
  return tickets;
}

// Main execution
const totalSales = 500; // Total sales amount (e.g., AED 100,000)
const productPrice = 5; // Product price
// const ticketNumbers = readTicketsFromFile("tickets.txt"); // Read tickets from file
const ticketNumbers = [
  ["98", "59", "71", "19", "25", "84"],
  ["24", "32", "49", "52", "38", "21"],
  ["90", "55", "68", "37", "97", "53"],
  ["62", "26", "71", "34", "20", "79"],
  ["70", "14", "55", "25", "00", "69"],
  ["80", "23", "92", "87", "68", "17"],
  ["54", "39", "85", "45", "79", "04"],
  ["19", "09", "11", "22", "24", "25"],
  ["76", "21", "25", "32", "37", "59"],
  ["27", "58", "03", "16", "31", "90"],
];

const gameResult = simulateGame(ticketNumbers, totalSales, productPrice);
console.log(`Winning Number: ${gameResult.winningNumber}`);
console.log(`Total Prize Distributed: AED ${gameResult.totalPrizeDistributed}`);
console.log("Winners:", gameResult.winners);
console.log("Winner Count:", gameResult.winners.length);
