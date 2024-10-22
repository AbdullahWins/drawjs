const fs = require("fs");

// Constants
const TICKET_PRICE = 5; // Product price

// Function to calculate the prize based on matching numbers
function calculateChancePrize(matches) {
  switch (matches) {
    case 4:
      return TICKET_PRICE * 1000; // 3 correct numbers
    case 3:
      return TICKET_PRICE * 2; // 2 correct numbers
    default:
      return 0; // no prize
  }
}

// Function to simulate the game
function simulateGame(ticketNumbers, totalSales) {
  console.log("simulateGame started");
  const prizeThreshold = totalSales * 0.45; // Maximum allowed prize (15% of sales)
  const minPrizeThreshold = totalSales * 0.75; // Minimum allowed prize (10% of sales)
  const awardRange = `Prize Range: AED ${minPrizeThreshold} to AED ${prizeThreshold}`;

  let totalPrizeDistributed = 0;
  let winners = [];
  let winningNumber = null;

  // Analyze number frequency
  const { numberFrequency, frequencyMap } =
    analyzeNumberFrequency(ticketNumbers);

  // Generate a valid winning number
  while (winningNumber === null) {
    winningNumber = generateWinningTicket(numberFrequency);

    // Calculate prize distribution
    winners = ticketNumbers.map((ticket) => {
      const matches = countMatchingSlots(ticket, winningNumber); // Count how many slots match
      const prize = calculateChancePrize(matches);
      return { ticket, matches, prize };
    });

    // Filter out winners with zero prize
    winners = winners.filter((winner) => winner.prize > 0);
    totalPrizeDistributed = winners.reduce(
      (sum, winner) => sum + winner.prize,
      0
    );
    
    console.log("winningNumber", winningNumber);
    console.log("totalPrizeDistributed", totalPrizeDistributed);
    console.log("minPrizeThreshold", minPrizeThreshold);
    console.log("prizeThreshold", prizeThreshold);
    console.log("winners", winners);

    // Check if the total prize is within the acceptable range
    if (
      totalPrizeDistributed < minPrizeThreshold ||
      totalPrizeDistributed > prizeThreshold
    ) {
      console.log("Prize distribution out of bounds. Retrying...");
      winningNumber = null; // Reset if prize distribution is out of bounds
    }
  }
  console.log("simulateGame end");

  return {
    winningNumber,
    totalPrizeDistributed,
    winners,
    awardRange,
    frequencyMap,
  };
}

// Function to analyze the frequency of numbers in tickets
function analyzeNumberFrequency(ticketNumbers) {
  const frequencyMap = new Map();

  // Count occurrences of each number
  ticketNumbers.forEach((ticket) => {
    ticket.forEach((number) => {
      frequencyMap.set(number, (frequencyMap.get(number) || 0) + 1);
    });
  });

  // Create an array for all numbers 1-99
  const allNumbers = Array.from({ length: 99 }, (_, i) => i + 1);

  // Find most used and least used numbers
  const sortedFrequencies = [...frequencyMap.entries()].sort(
    (a, b) => b[1] - a[1]
  ); // Sort by frequency (descending)

  const mostUsedNumbers = sortedFrequencies
    .slice(0, 5)
    .map(([number, count]) => ({ number, count }));
  const leastUsedNumbers = sortedFrequencies
    .slice(-5)
    .map(([number, count]) => ({ number, count }));

  // Find not used numbers
  const usedNumbers = new Set(frequencyMap.keys());
  const notUsedNumbers = allNumbers.filter(
    (number) => !usedNumbers.has(number)
  );

  // Log results
  console.log("Most Used Numbers:", mostUsedNumbers);
  console.log("Least Used Numbers:", leastUsedNumbers);
  console.log("Not Used Numbers:", notUsedNumbers);

  return {
    numberFrequency: sortedFrequencies.map((entry) => entry[0]),
    frequencyMap,
  };
}

// Function to generate a unique winning ticket based on frequency
function generateWinningTicket(numberFrequency) {
  //   console.log("numberFrequency", numberFrequency);
  const winningTicket = [];
  const usedNumbers = new Set();

  // Start with the least used numbers
  for (let i = 0; i < Math.min(3, numberFrequency.length); i++) {
    winningTicket.push(numberFrequency[i]);
    usedNumbers.add(numberFrequency[i]);
  }

  // Fill in the remaining numbers with unused numbers
  while (winningTicket.length < 5) {
    const randomNumber = Math.floor(Math.random() * 99) + 1; // Generate a number between 1 and 99
    if (
      !usedNumbers.has(randomNumber) &&
      !winningTicket.includes(randomNumber)
    ) {
      winningTicket.push(randomNumber);
      usedNumbers.add(randomNumber);
    }
  }

  return winningTicket;
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

// Function to read tickets from a text file
function readTicketsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  let tickets;

  try {
    tickets = JSON.parse(fileContent).map((ticket) => ticket.map(Number)); // Convert strings to numbers
  } catch (error) {
    console.error("Error parsing ticket file:", error);
    tickets = []; // Return an empty array in case of error
  }

  return tickets;
}

// Main execution
const ticketNumbers = readTicketsFromFile("tickets.txt"); // Read tickets from file
const totalSales = ticketNumbers.length * TICKET_PRICE; // Total sales amount (e.g., AED 50,000)

if (ticketNumbers.length === 0) {
  console.error("No valid tickets found. Exiting simulation.");
  process.exit(1); // Exit if there are no valid tickets
}

const gameResult = simulateGame(ticketNumbers, totalSales);

// Log the results
console.log("Winners:", gameResult.winners);
console.log(`Winning Number: ${gameResult.winningNumber}`);
console.log(`Total Prize Distributed: AED ${gameResult.totalPrizeDistributed}`);
console.log("Winner Count:", gameResult.winners.length);
console.log("Award Range:", gameResult.awardRange);
