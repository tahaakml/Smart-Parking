const express = require('express');
const readline = require('readline');
const fs = require('fs');
const mongoose = require('mongoose');

// MongoDB connection URL
const mongoUrl = 'mongodb+srv://Park_usr:tv9VOI902dcAyLvr@cluster0.dsb0mda.mongodb.net/ParkDB';

// Connect to MongoDB using Mongoose
mongoose.connect(mongoUrl);
const db = mongoose.connection;

// Check connection
db.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');

  // Define a schema for the 'smartparkingusers' collection
  const userSchema = new mongoose.Schema({
    matricule: String,
    dateArrivee: String,
    datePartir: String,
    place: Number, // Changed to Number for place counter
  });

  // Create a model for the 'smartparkingusers' collection
  const User = mongoose.model('smartparkingusers', userSchema);

  // Create a readline interface to read the file line by line
  function readDataFromFile() {
    const rl = readline.createInterface({
      input: fs.createReadStream('./CarsOut.txt'),
      crlfDelay: Infinity,
    });

  

  // Read data from the text file line by line
  rl.on('line', line => {
    const values = line.split(',');
  
    // Assuming the order is matricule, datePartir
    const matricule = values[0].trim();
    const datePartir = values[1].trim();
let place = 0;
    User.findOne({ matricule: matricule }).exec()
      .then(existingUser => {
        if (existingUser) {
          console.log(`Server running ...`);
          // Update the existing user with new values
          if (existingUser.place != 0){User.updateOne({ matricule: matricule }, {  datePartir: datePartir, place: place })
            .then(() => {
              console.log(`User out detected: ${datePartir}, place: ${place}`);
            })
            .catch(err => {
              console.error('Error updating user:', err);
            });}
        } else if (!existingUser) {
          console.log(`User with matricule ${matricule} not found. Ignoring update.`);
        }
      })
      .catch(err => {
        console.error('Error:', err);
      });
  });
}
  // Call the function every 1 second
  setInterval(readDataFromFile, 1000);
});
