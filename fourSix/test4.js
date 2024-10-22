const fs = require("fs");

const percentage = 70;

// block generator
const generateBlock = (amountOfBlock = 4) => {
  const block = new Set();

  // Generate 4 unique random numbers between 1 and 15 for the block
  while (block.size < amountOfBlock) {
    const randomNum = Math.floor(Math.random() * 9) + 1;
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
    token = [...block].map((num) => String(num).padStart(1, "0")).join(" ");

    // Add the token to the set
    tokens.add({
      token,
      price: 50,
      straigtThreeNumberMatchPrize: 0,
      chanceTwoNumberMatchPrize: 150,
      chanceOneNumberMatchPrize: 10,
    });
  }

  //save tokens to a file
  fs.writeFileSync("./fourSix/tokens.json", JSON.stringify([...tokens], null, 2));

  return [...tokens];
};

// generate draw winner number
const generateDrawWinner = () => {
  const block = generateBlock();
  return [...block].map((num) => String(num).padStart(1, "0")).join(" ");
};

const tickets = generateToken(5000);
const totalSoldAmount = calculateTotalPrize(tickets, "price");
const limitedPercentageOfSoldAmount = (
  totalSoldAmount *
  (percentage / 100)
).toFixed(2);
// console.log(tickets);

console.log(`
Ticket Sold Amount ${totalSoldAmount} AED 
${percentage}% of Sold Amount ${limitedPercentageOfSoldAmount} AED 
Total Ticket Sold ${tickets.length}
`);

// split the token and draw number into blocks and check if the need blocks are matched
const checkPartialBlockMatch = (
  token,
  drawNumber,
  firstSlice = 0,
  lastSlice = 4,
  index
) => {
  if (index) {
    const tokenBlocks = token.split(" ").slice(firstSlice, lastSlice);
    const raffelBlocks = drawNumber.split(" ").slice(firstSlice, lastSlice);
    return tokenBlocks.every((block, index) => block === raffelBlocks[index]);
  }
};

// check matching block
const makeDraw = (tickets) => {
  let theDrawNumber;
  let totalAmountOfPrize = 0;
  let chanceTwoNumberMatchedTickets = [];
  let chanceOneNumberMatchedTickets = [];

  // check if the ticket is matched with the draw number
  do {
    totalAmountOfPrize = 0;
    theDrawNumber = generateDrawWinner();
    chanceOneNumberMatchedTickets = [];

    tickets.forEach((token, index) => {
      // !re-loop the draw number if all & last three blocks are matched
      const isFullTicketMatch = token.token === theDrawNumber;
      const isLastThreeBlockMatch = checkPartialBlockMatch(
        token.token,
        theDrawNumber,
        1,
        4
      );
      const isStraightThreeNumberMatch = checkPartialBlockMatch(
        token.token,
        theDrawNumber,
        0,
        3,
        index
      );

      // check if the ticket is matched with the draw number
      const isChanceTwoNumberMatch = checkPartialBlockMatch(
        token.token,
        theDrawNumber,
        2,
        4,
        index
      );
      const isChanceOneNumberMatch = checkPartialBlockMatch(
        token.token,
        theDrawNumber,
        3,
        4,
        index
      );

      if (
        isLastThreeBlockMatch ||
        isFullTicketMatch ||
        isStraightThreeNumberMatch
      ) {
        theDrawNumber = generateDrawWinner();
        // console.log(`Last three blocks or all blocks are matched`);
      } else {
        if (isChanceTwoNumberMatch) {
          chanceTwoNumberMatchedTickets.push(token);
        }

        if (isChanceOneNumberMatch) {
          chanceOneNumberMatchedTickets.push(token);
        }
      }
    });

    // check if there is no winner for this draw
    if (
      !chanceTwoNumberMatchedTickets.length &&
      !chanceOneNumberMatchedTickets.length
    ) {
      console.log(`No winner for this draw`);
    }

    // total prize amount
    const totalChanceTwoNumberPrize = calculateTotalPrize(
      chanceTwoNumberMatchedTickets,
      "chanceTwoNumberMatchPrize"
    );
    const totalChanceOneNumberPrize = calculateTotalPrize(
      chanceOneNumberMatchedTickets,
      "chanceOneNumberMatchPrize"
    );
    totalAmountOfPrize = totalChanceTwoNumberPrize + totalChanceOneNumberPrize;

    // check if the total prize amount is greater than 15% of total sold amount
    if (totalAmountOfPrize > limitedPercentageOfSoldAmount) {
      console.log(
        `Total Prize Amount is greater than 15% of total sold amount`
      );
    }
  } while (
    (!chanceTwoNumberMatchedTickets.length &&
      !chanceOneNumberMatchedTickets.length) ||
    totalAmountOfPrize > limitedPercentageOfSoldAmount
  );

  return {
    chanceTwoNumberMatchedTickets: chanceTwoNumberMatchedTickets.length,
    chanceOneNumberMatchedTickets: chanceOneNumberMatchedTickets.length,
    theDrawNumber,
    totalAmountOfPrize: `Total Amount of prize: ${totalAmountOfPrize} AED`,
    percentageOfSoldAmount: Number(
      ((totalAmountOfPrize / totalSoldAmount) * 100).toFixed(2)
    ),
  };
};

console.log(makeDraw(tickets));

/**
 *
 * @param {loopAmount} number to check the average of 100 times sold amount
 * @variation {drawNumbers} to check the draw numbers
 *
 */

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

// Using await to get the result
// get100TimesResult().then(results => {
//     const avarageOf100SoldAmount = ((results.reduce((sum, item) => sum + item.percentageOfSoldAmount, 0)) / loopAmount).toFixed(2);
//     console.log(`Percentage of 100 times: ${avarageOf100SoldAmount}`);

//     // draw number
//     const drawNumbers = results.map((item, index) => ({
//         serial: index + 1, theDrawNumber: item.theDrawNumber
//     }));
//     console.log(drawNumbers, 'the draw numbers');

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

// const checkWinner = (tickets) => {
//     let count = tickets.length;
//     const winners = [];
//     const uniqueDrawNumbers = [];

//     do {
//         const drawNumber = generateDrawWinner();
//         winners.push({ number: count, drawNumber });
//         if (!uniqueDrawNumbers.find((item) => item === drawNumber)) {
//             uniqueDrawNumbers.push(drawNumber);
//         }
//         count--;
//     } while (count > 1);

//     return {
//         totalTickets: tickets.length,
//         totalWinners: winners.length,
//         uniuqeTotalDrawNumbers: uniqueDrawNumbers.length,
//         // winners: winners.reverse(),
//         // uniqueDrawNumbers
//     };
// }

// console.log(checkWinner(tickets));
