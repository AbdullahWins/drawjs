const fs = require("fs");

// Constants
const TICKET_PRICE = 5; // Ticket price

/* ---------------------------------------------------
   Utility Functions (General-purpose)
   ---------------------------------------------------
   These functions handle general operations like
   calculating the prize, counting matching slots
   between two tickets, and reading tickets from a file.
--------------------------------------------------- */

// Function to calculate the prize based on matching numbers
// Takes in the number of matches and returns the corresponding prize.
function calculateChancePrize(matches) {
  switch (matches) {
    case 4:
      return TICKET_PRICE * 1000; // If 4 numbers match, big prize
    case 3:
      return TICKET_PRICE * 2; // If 3 numbers match, smaller prize
    default:
      return 0; // If less than 3 numbers match, no prize
  }
}

// Function to count matching numbers between a player's ticket and the winning number
// Does not consider the position of the numbers, only if they exist in both sets.
function countMatchingSlots(ticket, winningNumber) {
  const ticketSet = new Set(ticket); // Convert the ticket array to a set for fast lookup
  const winningSet = new Set(winningNumber); // Convert the winning numbers to a set
  let matches = 0;

  // Count how many numbers are present in both sets
  winningSet.forEach((number) => {
    if (ticketSet.has(number)) {
      matches++;
    }
  });

  return matches; // Return the total number of matches
}

// Function to read ticket data from a file and convert it into an array of arrays
// The file is expected to contain JSON data where each ticket is an array of numbers.
function readTicketsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  let tickets;

  try {
    tickets = JSON.parse(fileContent).map((ticket) => ticket.map(Number)); // Convert strings to numbers
  } catch (error) {
    console.error("Error parsing ticket file:", error); // Log error in case of JSON parsing issues
    tickets = []; // Return an empty array in case of error to prevent crashing
  }

  return tickets; // Return the parsed tickets
}

/* ---------------------------------------------------
   Frequency Analysis Module (Analyze Number Frequency)
   ---------------------------------------------------
   This section analyzes the frequency of numbers
   appearing in tickets and helps identify the most
   and least used numbers, as well as numbers not used.
--------------------------------------------------- */

// Function to analyze the frequency of numbers across all tickets
// It returns the frequency map and a sorted list of numbers by their usage frequency.
function analyzeNumberFrequency(ticketNumbers) {
  const frequencyMap = new Map(); // Stores the frequency of each number

  // Count occurrences of each number in the tickets
  ticketNumbers.forEach((ticket) => {
    ticket.forEach((number) => {
      frequencyMap.set(number, (frequencyMap.get(number) || 0) + 1); // Increment frequency
    });
  });

  // Create an array for all numbers from 1 to 99
  const allNumbers = Array.from({ length: 99 }, (_, i) => i + 1);

  // Sort numbers by frequency in descending order
  const sortedFrequencies = [...frequencyMap.entries()].sort(
    (a, b) => b[1] - a[1]
  );

  // Identify the top 5 most used numbers
  const mostUsedNumbers = sortedFrequencies
    .slice(0, 5)
    .map(([number, count]) => ({ number, count }));

  // Identify the 5 least used numbers
  const leastUsedNumbers = sortedFrequencies
    .slice(-5)
    .map(([number, count]) => ({ number, count }));

  // Identify numbers that were never used in any ticket
  const usedNumbers = new Set(frequencyMap.keys());
  const notUsedNumbers = allNumbers.filter(
    (number) => !usedNumbers.has(number)
  );

  // Log the results for analysis
  console.log("Most Used Numbers:", mostUsedNumbers);
  console.log("Least Used Numbers:", leastUsedNumbers);
  console.log("Not Used Numbers:", notUsedNumbers);

  return {
    numberFrequency: sortedFrequencies.map((entry) => entry[0]), // Return numbers sorted by frequency
    frequencyMap, // Return the frequency map for further use
  };
}

/* ---------------------------------------------------
   Winning Ticket Generation Module
   ---------------------------------------------------
   This section generates a winning ticket based on
   frequency analysis, starting with the least-used
   numbers and filling up the ticket with random ones.
--------------------------------------------------- */

// Function to generate a winning ticket based on number frequency
// It starts with the least used numbers and fills the ticket with random numbers if needed.
function generateWinningTicket(numberFrequency) {
  // console.log("numberFrequency", numberFrequency);
  const winningTicket = [];
  const usedNumbers = new Set();

  // Start by adding the least used numbers to the winning ticket
  for (let i = 0; i < Math.min(4, numberFrequency.length); i++) {
    winningTicket.push(numberFrequency[i]); // Add least used number to the ticket
    usedNumbers.add(numberFrequency[i]); // Mark it as used
  }

  // Fill the rest of the ticket with random unused numbers
  while (winningTicket.length < 5) {
    const randomNumber = Math.floor(Math.random() * 99) + 1; // Random number between 1 and 99
    if (
      !usedNumbers.has(randomNumber) &&
      !winningTicket.includes(randomNumber)
    ) {
      winningTicket.push(randomNumber); // Add the number to the ticket if it hasn't been used
      usedNumbers.add(randomNumber); // Mark it as used
    }
  }

  return winningTicket; // Return the generated winning ticket
}

/* ---------------------------------------------------
   Game Simulation Logic
   ---------------------------------------------------
   This section handles the main game simulation,
   including ticket processing, prize distribution,
   and determining winners.
--------------------------------------------------- */

// Function to simulate the game and distribute prizes
function simulateGame(ticketNumbers, totalSales) {
  console.log("simulateGame started");

  const prizeThreshold = totalSales * 0.45; // Maximum allowed prize (45% of total sales)
  const minPrizeThreshold = totalSales * 0.75; // Minimum prize pool (75% of total sales)
  const awardRange = `Prize Range: AED ${minPrizeThreshold} to AED ${prizeThreshold}`;

  let totalPrizeDistributed = 0;
  let winners = [];
  let winningNumber = null;

  // Analyze number frequency from all tickets
  const { numberFrequency, frequencyMap } =
    analyzeNumberFrequency(ticketNumbers);

  // Generate a valid winning number and ensure prize distribution is within bounds
  while (winningNumber === null) {
    winningNumber = generateWinningTicket(numberFrequency);

    // Calculate the prize distribution for each ticket
    winners = ticketNumbers.map((ticket) => {
      const matches = countMatchingSlots(ticket, winningNumber); // Count matching numbers
      const prize = calculateChancePrize(matches); // Calculate prize based on matches
      return { ticket, matches, prize }; // Return ticket details with prize information
    });

    // Filter out tickets that didn't win a prize
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

    // If the total prize distribution is out of bounds, retry with a new winning number
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
    winningNumber, // Return the final winning number
    totalPrizeDistributed, // Total prize distributed among winners
    winners, // Array of winning tickets
    awardRange, // The range of allowable prize distribution
    frequencyMap, // The frequency of numbers in the tickets
  };
}

/* ---------------------------------------------------
   Main Execution (Running the Game)
   ---------------------------------------------------
   This section handles the main game execution,
   reading ticket data, simulating the game,
   and logging the results.
--------------------------------------------------- */

// Read tickets from the file and simulate the game
const ticketNumbers = readTicketsFromFile("tickets.txt"); // Read ticket data from file
const totalSales = ticketNumbers.length * TICKET_PRICE; // Calculate total sales (number of tickets sold * ticket price)

if (ticketNumbers.length === 0) {
  console.error("No valid tickets found. Exiting simulation.");
  process.exit(1); // Exit if there are no valid tickets
}

const gameResult = simulateGame(ticketNumbers, totalSales);

// Log the results of the game
// console.log("Winners:", gameResult.winners);
// console.log(`Winning Number: ${gameResult.winningNumber}`);
// console.log(`Total Prize Distributed: AED ${gameResult.totalPrizeDistributed}`);
// console.log("Winner Count:", gameResult.winners.length);
// console.log("Award Range:", gameResult.awardRange);
