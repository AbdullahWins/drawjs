import fs from "fs";

const percentage = 70;

console.log(percentage / 100);

const generateBlock = (amountOfBlock = 6) => {
  const block = new Set();

  // Generate 6 unique random numbers between 1 and 25 for the block
  while (block.size < amountOfBlock) {
    const randomNum = Math.floor(Math.random() * 25) + 1;
    block.add(randomNum);
  }

  return block;
};

// Helper function to calculate total prize amount
const calculateTotalPrize = (array, key) => {
  return array.reduce((sum, token) => sum + token[key], 0);
};

// Token generator
const generateToken = (amountOfToken = 100) => {
  const tokens = new Set();

  while (tokens.size < amountOfToken) {
    let token = "";
    const block = generateBlock();

    // Convert the block numbers to a string with two digits and join them with a space
    token = [...block].map((num) => String(num).padStart(2, "0")).join(" ");

    // Add the token to the set
    tokens.add({
      token,
      price: 5,
      oneAndTwoNumberPirze: 0,
      threeNumberMatchPrize: 10,
    });
  }

  return [...tokens];
};

// generate draw winner number
const generateDrawWinner = () => {
  const block = generateBlock();
  return [...block].map((num) => String(num).padStart(2, "0")).join(" ");
};

const tickets = generateToken(1000);
// console.log(tickets.map(token => token.token).join('\n'));
const totalSoldAmount = calculateTotalPrize(tickets, "price");
const limitedPercentageOfSoldAmount = (
  totalSoldAmount *
  (percentage / 100)
).toFixed(2);

// Convert tokens to string format
const ticketsString = tickets.map((token) => `${token.token}`).join("\n");

// Write tokens to a file
fs.writeFile("tickets.txt", ticketsString, (err) => {
  if (err) throw err;
  console.log("Tickets have been saved to tickets.txt");
});

console.log(`
Ticket Sold Amount ${totalSoldAmount} AED 
${percentage}% of Sold Amount ${limitedPercentageOfSoldAmount} AED 
Total Ticket Sold ${tickets.length}
`);

// split the token and draw number into blocks and check if the needed blocks are matched
const checkHowManyBlockMatch = (ticket, drawNumber) => {
  const ticketBlocks = ticket.split(" ");
  const raffelBlocks = drawNumber.split(" ");

  let count = 0;
  const matchedIndices = new Set();

  for (let i = 0; i < ticketBlocks.length; i++) {
    for (let j = 0; j < raffelBlocks.length; j++) {
      // if (ticketBlocks[i] === raffelBlocks[j]) {
      if (ticketBlocks[i] === raffelBlocks[j] && !matchedIndices.has(j)) {
        matchedIndices.add(j);
        count++;
        break;
      }
    }
  }
  return count;
};
// 06 06 26 15 11 16 06 06 06 06 06 06
// const ticket = "06 06 06 15 11 16";
// const drawNumber = "06 10 18 22 23 25";
// const result = checkHowManyBlockMatch(ticket, drawNumber);
// console.log(`Matched Blocks: ${result}`);

// check matching block
const makeDraw = (tickets) => {
  let theDrawNumber;
  let totalAmountOfPrize = 0;
  let threeNumberMatchedTickets = [];
  let oneAndTwoNumberMatchedTickets = [];

  // check if the ticket is matched with the draw number
  do {
    totalAmountOfPrize = 0;
    theDrawNumber = generateDrawWinner();
    threeNumberMatchedTickets = [];
    oneAndTwoNumberMatchedTickets = [];

    tickets.forEach((ticket, index) => {
      // !re-loop the draw number if all & last three blocks are matched
      const totalMatchedNumber = checkHowManyBlockMatch(
        ticket.token,
        theDrawNumber
      );

      // console.log(totalMatchedNumber);

      if (totalMatchedNumber >= 4) {
        theDrawNumber = generateDrawWinner();
      } else {
        if (totalMatchedNumber === 3) {
          threeNumberMatchedTickets.push(ticket);
        }

        if (totalMatchedNumber === 1 || totalMatchedNumber === 2) {
          oneAndTwoNumberMatchedTickets.push(ticket);
        }
      }
    });

    // check if there is no winner for this draw
    if (
      !threeNumberMatchedTickets.length &&
      !oneAndTwoNumberMatchedTickets.length
    ) {
      console.log(`No winner for this draw`);
    }

    // total prize amount
    const totalThreeNumberPrize = calculateTotalPrize(
      threeNumberMatchedTickets,
      "threeNumberMatchPrize"
    );
    const totalFourumberPrize = calculateTotalPrize(
      oneAndTwoNumberMatchedTickets,
      "oneAndTwoNumberPirze"
    );
    totalAmountOfPrize = totalThreeNumberPrize + totalFourumberPrize;

    // check if the total prize amount is greater than 15% of total sold amount
    if (totalAmountOfPrize > limitedPercentageOfSoldAmount) {
      console.log(
        `Total Prize Amount is greater than ${percentage}% of total sold amount`
      );
    }
    //
  } while (
    (!threeNumberMatchedTickets.length &&
      !oneAndTwoNumberMatchedTickets.length) ||
    totalAmountOfPrize > limitedPercentageOfSoldAmount
  );

  return {
    threeNumberMatchedTickets: threeNumberMatchedTickets.length,
    oneAndTwoNumberMatchedTickets: oneAndTwoNumberMatchedTickets.length,
    theDrawNumber,
    totalAmountOfPrize: `Total Amount of prize: ${totalAmountOfPrize} AED`,
    percentageOfSoldAmount: Number(
      ((totalAmountOfPrize / totalSoldAmount) * 100).toFixed(2)
    ),
  };
};

console.log(makeDraw(tickets));

const loopAmount = 100;

// Run the makeDraw function 100 times and store the results in an array
// const get100TimesResult = async () => {
//     const results = [];

//     for (let i = 0; i < loopAmount; i++) {
//         const res = await makeDraw(tickets);
//         results.push(res);
//     }
//     return results;
// }

// // Using await to get the result
// get100TimesResult().then(results => {
//     const avarageOf100SoldAmount = ((results.reduce((sum, item) => sum + item.percentageOfSoldAmount, 0)) / loopAmount).toFixed(2);
//     console.log(`Percentage of 100 times: ${avarageOf100SoldAmount}`);

//     // draw number
//     const drawNumbers = results.map((item, index) => ({
//         serial: index + 1, theDrawNumber: item.theDrawNumber
//     }));
//     // console.log(drawNumbers, 'the draw numbers');

//     // Find unique draw numbers
//     const uniqueDrawNumbersSet = [];
//     drawNumbers.map((item) => {
//         if (!uniqueDrawNumbersSet.includes(item.theDrawNumber)) {
//             uniqueDrawNumbersSet.push({
//                 serial: uniqueDrawNumbersSet.length + 1, theDrawNumber: item.theDrawNumber
//             });
//         }
//     });

//     console.log(uniqueDrawNumbersSet.length, 'unique draw numbers');
// }).catch(error => {
//     console.error(error);
// });
