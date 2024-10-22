const fs = require("fs");

const CONFIG = {
  TICKET_PRICE: 5,
  SHARING_PERCENTAGE_LOW: 0.45, // 45% of total sales
  SHARING_PERCENTAGE_HIGH: 0.46, // 65% of total sales
  PRIZE_TIERS: [
    { matches: 4, prize: 10000 }, // Fixed 50,000 AED prize for 4 matches
    { matches: 3, prize: 5000 }, // Fixed 5,000 AED prize for 3 matches
    { matches: 2, prize: 10 }, // Fixed 10 AED prize for 2 matches
  ],
  MAX_MATCHES: 4,
  MAX_ATTEMPTS: 100,
};

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

function calculatePrize(matches) {
  const tier = CONFIG.PRIZE_TIERS.find((t) => t.matches === matches);
  return tier ? tier.prize : 0; // Return fixed prize for the tier
}

function countMatchingSlots(ticket, winningNumber) {
  const ticketSet = new Set(ticket);
  let matches = 0;
  winningNumber.forEach((number) => {
    if (ticketSet.has(number)) {
      matches++;
    }
  });
  return Math.min(matches, CONFIG.MAX_MATCHES);
}

function analyzeTicketNumbers(tickets) {
  const frequencyMap = new Map();
  tickets.forEach((ticket) => {
    ticket.forEach((num) => {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    });
  });

  return Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([num, freq]) => ({ number: num, frequency: freq }));
}

function generateWinningTicket(ticketNumbers, previousWinningNumbers) {
  const numberAnalysis = analyzeTicketNumbers(ticketNumbers);

  // Create clusters of numbers that appear together
  const numberClusters = [];
  for (let i = 0; i < ticketNumbers.length; i++) {
    for (let j = i + 1; j < Math.min(i + 100, ticketNumbers.length); j++) {
      const commonNumbers = ticketNumbers[i].filter((num) =>
        ticketNumbers[j].includes(num)
      );
      if (commonNumbers.length >= 2) {
        numberClusters.push(commonNumbers);
      }
    }
  }

  // Sort clusters by size
  numberClusters.sort((a, b) => b.length - a.length);

  // Strategy: Mix between common numbers and random numbers
  const winningTicket = new Set();

  // Maybe use a cluster (50% chance)
  if (numberClusters.length > 0 && Math.random() < 0.5) {
    const randomCluster =
      numberClusters[
        Math.floor(Math.random() * Math.min(10, numberClusters.length))
      ];
    randomCluster.slice(0, 2).forEach((num) => winningTicket.add(num));
  }

  // Add some common numbers
  while (winningTicket.size < 3) {
    if (Math.random() < 0.6) {
      // 60% chance to pick from common numbers
      const randomIndex = Math.floor(
        Math.random() * Math.min(20, numberAnalysis.length)
      );
      winningTicket.add(numberAnalysis[randomIndex].number);
    } else {
      const randomNumber = Math.floor(Math.random() * 99) + 1;
      winningTicket.add(randomNumber);
    }
  }

  // Fill remaining slots with random numbers
  while (winningTicket.size < 5) {
    const randomNumber = Math.floor(Math.random() * 99) + 1;
    winningTicket.add(randomNumber);
  }

  const result = Array.from(winningTicket);

  // Check if too similar to previous winning numbers
  const isTooSimilar = previousWinningNumbers.some((prev) => {
    const matches = countMatchingSlots(prev, result);
    return matches >= CONFIG.MAX_MATCHES;
  });

  if (isTooSimilar) {
    return generateWinningTicket(ticketNumbers, previousWinningNumbers);
  }

  return result;
}

function analyzePrizeDistribution(winners, totalSales) {
  const matchCounts = {
    4: winners.filter((w) => w.matches === 4).length,
    3: winners.filter((w) => w.matches === 3).length,
    2: winners.filter((w) => w.matches === 2).length,
  };

  // Calculate total prize for each category
  const totalPrizeDistributed = Object.keys(matchCounts).reduce(
    (total, key) => {
      const matches = parseInt(key);
      const winnersCount = matchCounts[key];
      const tier = CONFIG.PRIZE_TIERS.find((t) => t.matches === matches);
      return total + (tier ? tier.prize * winnersCount : 0);
    },
    0
  );

  const totalTickets = totalSales / CONFIG.TICKET_PRICE;
  const matchRates = {
    4: matchCounts[4] / totalTickets,
    3: matchCounts[3] / totalTickets,
    2: matchCounts[2] / totalTickets,
  };

  return {
    matchCounts,
    matchRates,
    totalPrizeDistributed,
    prizePercentage: (totalPrizeDistributed / totalSales) * 100,
  };
}

function isPrizeDistributionValid(totalPrize, totalSales) {
  const minPrize = totalSales * CONFIG.SHARING_PERCENTAGE_LOW;
  const maxPrize = totalSales * CONFIG.SHARING_PERCENTAGE_HIGH;
  return totalPrize >= minPrize && totalPrize <= maxPrize;
}

function simulateGame(ticketNumbers) {
  console.log("Simulation started");

  const totalSales = ticketNumbers.length * CONFIG.TICKET_PRICE;
  const minPrize = totalSales * CONFIG.SHARING_PERCENTAGE_LOW;
  const maxPrize = totalSales * CONFIG.SHARING_PERCENTAGE_HIGH;

  console.log("\nConfiguration:");
  console.log(`Maximum matches allowed: ${CONFIG.MAX_MATCHES}`);
  console.log(`Total Sales: AED ${totalSales}`);
  console.log(
    `Prize Range: AED ${minPrize.toFixed(2)} to AED ${maxPrize.toFixed(2)}`
  );

  let winners = [];
  let winningNumber = null;
  let attempts = 0;
  const previousWinningNumbers = [];

  while (attempts < CONFIG.MAX_ATTEMPTS) {
    attempts++;
    winningNumber = generateWinningTicket(
      ticketNumbers,
      previousWinningNumbers
    );
    previousWinningNumbers.push(winningNumber);

    winners = ticketNumbers.map((ticket) => {
      const matches = countMatchingSlots(ticket, winningNumber);
      return {
        ticket,
        matches,
        prize: calculatePrize(matches), // Pass only matches for prize calculation
        ticketString: ticket.join(", "),
      };
    });

    winners = winners.filter((winner) => winner.prize > 0);

    const analysis = analyzePrizeDistribution(winners, totalSales);

    // Log the attempt results
    console.log(`\nAttempt ${attempts}:`);
    console.log("Winning Numbers:", winningNumber.join(", "));
    console.log(
      "Total Prize Distributed: AED",
      analysis.totalPrizeDistributed.toFixed(2)
    );
    console.log("Prize Distribution:", analysis);

    if (isPrizeDistributionValid(analysis.totalPrizeDistributed, totalSales)) {
      console.log(`\nValid distribution found after ${attempts} attempts:`);
      console.log("Match Distribution:", analysis.matchCounts);
      console.log(
        "Match Rates:",
        Object.entries(analysis.matchRates)
          .map(([matches, rate]) => `${matches}: ${(rate * 100).toFixed(1)}%`)
          .join(", ")
      );
      console.log(
        `Prize Distribution: ${analysis.prizePercentage.toFixed(2)}% of sales`
      );

      return {
        winningNumber,
        totalPrizeDistributed: analysis.totalPrizeDistributed,
        winners,
        analysis,
      };
    } else {
      console.log("Prize distribution out of bounds. Retrying...");
    }
  }

  throw new Error(
    `Could not find valid distribution after ${CONFIG.MAX_ATTEMPTS} attempts`
  );
}

// Example usage
try {
  const ticketNumbers = readTicketsFromFile("tickets.txt");
  simulateGame(ticketNumbers);
} catch (error) {
  console.error("Error running simulation:", error.message);
}
