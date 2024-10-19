const fs = require("fs");

// Function to generate a ticket with random two-digit numbers
function generateRandomTicket() {
  const ticket = [];
  while (ticket.length < 5) {
    // Generate a random two-digit number (00-99)
    const num = String(Math.floor(Math.random() * 100)).padStart(2, "0"); // Two-digit number

    if (!ticket.includes(num)) {
      // Ensure uniqueness of the number
      ticket.push(num);
    }
  }
  return ticket;
}

// Generate multiple tickets
function generateTickets(numTickets) {
  const tickets = [];
  for (let i = 0; i < numTickets; i++) {
    tickets.push(generateRandomTicket());
  }
  return tickets;
}

// Function to format tickets for saving
function formatTickets(tickets) {
  return tickets.map((ticket) => `  ["${ticket.join('", "')}"],`).join("\n");
}

// Number of tickets to generate
const numberOfTickets = 10000; // Adjust as needed
const tickets = generateTickets(numberOfTickets);
const formattedTickets = formatTickets(tickets);

// Save to a text file
const output = `[\n${formattedTickets}\n]`;

fs.writeFile("tickets.txt", output, (err) => {
  if (err) {
    console.error("Error writing to file", err);
  } else {
    console.log("Tickets saved to tickets.txt");
  }
});
