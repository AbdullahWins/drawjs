const fs = require("fs");

// Function to calculate the prize based on matching numbers
function calculateChancePrize(matches, productPrice) {
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
  const threshold = `Prize Threshold: ${minPrizeThreshold} to ${prizeThreshold}`; // Debugging line to show prize threshold

  let totalPrizeDistributed = 0;
  let winners = [];
  let winningNumber = generateWinningTicket(ticketNumbers);

  // Calculate prize distribution
  winners = ticketNumbers.map((ticket) => {
    const matches = countMatchingSlots(ticket, winningNumber); // Count how many slots match
    const prize = calculateChancePrize(matches, productPrice);
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

  // Debugging output
  console.log(`Winners Details:`, winners); // Debugging line to show winners

  // Check if the total prize is within the acceptable range
  if (
    totalPrizeDistributed >= minPrizeThreshold &&
    totalPrizeDistributed <= prizeThreshold
  ) {
    return { winningNumber, totalPrizeDistributed, winners, threshold };
  } else {
    // If the prize distribution is not within the range, return empty winners
    console.log("Prize distribution not within acceptable range");
    return { winningNumber, totalPrizeDistributed, winners: [], threshold };
  }
}

// Function to count matching slots
function countMatchingSlots(ticket, winningNumber) {
  let matches = 0;
  for (let i = 0; i < ticket.length; i++) {
    if (ticket[i] === winningNumber[i]) {
      matches++;
    }
  }
  return matches;
}

// Function to generate a winning ticket
function generateWinningTicket(ticketNumbers) {
  const winningTicket = [];
  let totalMatches = Math.floor(Math.random() * 2) + 2; // Ensure at least 2 matches

  const randomTicketIndex = Math.floor(Math.random() * ticketNumbers.length);
  const selectedTicket = ticketNumbers[randomTicketIndex]; // Pick one of the sold tickets

  // Create a unique winning ticket based on random selection
  for (let i = 0; i < 6; i++) {
    if (totalMatches > 0 && Math.random() > 0.5) {
      winningTicket.push(selectedTicket[i]); // Take a number from the selected ticket
      totalMatches--;
    } else {
      const slot = String(Math.floor(Math.random() * 100)).padStart(2, "0");
      winningTicket.push(slot); // Generate random slot
    }
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
const ticketNumbers = readTicketsFromFile("tickets.txt"); // Read tickets from file

const gameResult = simulateGame(ticketNumbers, totalSales, productPrice);
console.log(`Winning Number: ${gameResult.winningNumber}`);
console.log(`Total Prize Distributed: AED ${gameResult.totalPrizeDistributed}`);
console.log("Winners:", gameResult.winners);
console.log("Winner Count:", gameResult.winners.length);
console.log("Threshold:", gameResult.threshold);
