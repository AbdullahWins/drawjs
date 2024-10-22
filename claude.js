const fs = require("fs");

// Constants and Configuration
const CONFIG = {
  TICKET_PRICE: 5,
  // New configuration options for flexible prize distribution
  PRIZE_TIERS: [
    { matches: 4, multiplier: 1000 },
    { matches: 3, multiplier: 2 },
    { matches: 2, multiplier: 1 }, // Added new tier
  ],
  MIN_PRIZE_PERCENTAGE: 0.75, // 75% of total sales
  MAX_PRIZE_PERCENTAGE: 0.45, // 45% of total sales
};

// Utility functions remain the same...
function readTicketsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  let tickets;
  try {
    tickets = JSON.parse(fileContent).map((ticket) => ticket.map(Number));
  } catch (error) {
    console.error("Error parsing ticket file:", error);
    tickets = [];
  }
  return tickets;
}

// Modified prize calculation with dynamic tier adjustment
function calculateChancePrize(matches, prizeMultipliers) {
  const tier = CONFIG.PRIZE_TIERS.find((t) => t.matches === matches);
  return tier
    ? CONFIG.TICKET_PRICE * tier.multiplier * prizeMultipliers[matches]
    : 0;
}

function countMatchingSlots(ticket, winningNumber) {
  const ticketSet = new Set(ticket);
  const winningSet = new Set(winningNumber);
  let matches = 0;
  winningSet.forEach((number) => {
    if (ticketSet.has(number)) {
      matches++;
    }
  });
  return matches;
}

// Modified number frequency analysis
function analyzeNumberFrequency(ticketNumbers) {
  const frequencyMap = new Map();
  ticketNumbers.forEach((ticket) => {
    ticket.forEach((number) => {
      frequencyMap.set(number, (frequencyMap.get(number) || 0) + 1);
    });
  });

  const allNumbers = Array.from({ length: 99 }, (_, i) => i + 1);
  const sortedFrequencies = [...frequencyMap.entries()].sort(
    (a, b) => b[1] - a[1]
  );

  return {
    numberFrequency: sortedFrequencies.map((entry) => entry[0]),
    frequencyMap,
  };
}

// Modified winning ticket generation with control over potential matches
function generateWinningTicket(numberFrequency, targetMatchDistribution) {
  const winningTicket = [];
  const usedNumbers = new Set();

  // Start with numbers that will help achieve target match distribution
  let numbersToInclude = new Set();
  Object.entries(targetMatchDistribution).forEach(([matches, count]) => {
    if (count > 0) {
      // Add numbers that appear in multiple tickets to increase chance of matches
      numberFrequency.slice(0, 20).forEach((num) => {
        if (numbersToInclude.size < 5) {
          numbersToInclude.add(num);
        }
      });
    }
  });

  // Add selected numbers to winning ticket
  numbersToInclude.forEach((num) => {
    if (winningTicket.length < 5) {
      winningTicket.push(num);
      usedNumbers.add(num);
    }
  });

  // Fill remaining slots with random numbers
  while (winningTicket.length < 5) {
    const randomNumber = Math.floor(Math.random() * 99) + 1;
    if (!usedNumbers.has(randomNumber)) {
      winningTicket.push(randomNumber);
      usedNumbers.add(randomNumber);
    }
  }

  return winningTicket;
}

// New function to adjust prize multipliers to meet threshold
function adjustPrizeMultipliers(winners, totalSales, currentPrizeDistribution) {
  const targetMin = totalSales * CONFIG.MIN_PRIZE_PERCENTAGE;
  const targetMax = totalSales * CONFIG.MAX_PRIZE_PERCENTAGE;

  let multipliers = {
    4: 1,
    3: 1,
    2: 1,
  };

  if (currentPrizeDistribution < targetMin) {
    // Increase multipliers until we reach minimum threshold
    const increase = targetMin / currentPrizeDistribution;
    Object.keys(multipliers).forEach((tier) => {
      multipliers[tier] = multipliers[tier] * increase;
    });
  } else if (currentPrizeDistribution > targetMax) {
    // Decrease multipliers to stay under maximum threshold
    const decrease = targetMax / currentPrizeDistribution;
    Object.keys(multipliers).forEach((tier) => {
      multipliers[tier] = multipliers[tier] * decrease;
    });
  }

  return multipliers;
}

// Modified main simulation function with prize distribution control
function simulateGame(ticketNumbers, totalSales) {
  console.log("simulateGame started");

  const prizeThreshold = totalSales * CONFIG.MAX_PRIZE_PERCENTAGE;
  const minPrizeThreshold = totalSales * CONFIG.MIN_PRIZE_PERCENTAGE;
  const awardRange = `Prize Range: AED ${minPrizeThreshold} to AED ${prizeThreshold}`;

  let totalPrizeDistributed = 0;
  let winners = [];
  let winningNumber = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 100;

  const { numberFrequency, frequencyMap } =
    analyzeNumberFrequency(ticketNumbers);

  // Target distribution of matches (can be adjusted)
  let targetMatchDistribution = {
    4: Math.ceil(ticketNumbers.length * 0.01), // 1% of tickets
    3: Math.ceil(ticketNumbers.length * 0.05), // 5% of tickets
    2: Math.ceil(ticketNumbers.length * 0.1), // 10% of tickets
  };

  while (winningNumber === null && attempts < MAX_ATTEMPTS) {
    attempts++;
    winningNumber = generateWinningTicket(
      numberFrequency,
      targetMatchDistribution
    );

    // Calculate initial winners and prizes
    winners = ticketNumbers.map((ticket) => {
      const matches = countMatchingSlots(ticket, winningNumber);
      return { ticket, matches, prize: 0 }; // Initial prize set to 0
    });

    // Count matches for each tier
    const matchCounts = {
      4: winners.filter((w) => w.matches === 4).length,
      3: winners.filter((w) => w.matches === 3).length,
      2: winners.filter((w) => w.matches === 2).length,
    };

    // Adjust prize multipliers to meet thresholds
    const initialPrizeDistribution = winners.reduce((sum, winner) => {
      const basePrize = calculateChancePrize(winner.matches, {
        4: 1,
        3: 1,
        2: 1,
      });
      return sum + basePrize;
    }, 0);

    const prizeMultipliers = adjustPrizeMultipliers(
      winners,
      totalSales,
      initialPrizeDistribution
    );

    // Apply adjusted prizes
    winners = winners.map((winner) => ({
      ...winner,
      prize: calculateChancePrize(winner.matches, prizeMultipliers),
    }));

    // Filter out non-winners and calculate total distribution
    winners = winners.filter((winner) => winner.prize > 0);
    totalPrizeDistributed = winners.reduce(
      (sum, winner) => sum + winner.prize,
      0
    );

    console.log(`Attempt ${attempts}:`, {
      winningNumber,
      totalPrizeDistributed,
      matchCounts,
      prizeMultipliers,
    });

    // Check if prize distribution meets requirements
    if (
      totalPrizeDistributed < minPrizeThreshold ||
      totalPrizeDistributed > prizeThreshold
    ) {
      winningNumber = null;
    }
  }

  return {
    winningNumber,
    totalPrizeDistributed,
    winners,
    awardRange,
    frequencyMap,
  };
}

// Export functions for testing and modular use
module.exports = {
  simulateGame,
  CONFIG,
};
