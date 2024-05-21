const express = require('express');
const readline = require('readline');
const fs = require('fs');
const mongoose = require('mongoose');

const mongoUrl = 'mongodb+srv://Park_usr:tv9VOI902dcAyLvr@cluster0.dsb0mda.mongodb.net/ParkDB';
mongoose.connect(mongoUrl);

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');

  const userSchema = new mongoose.Schema({
    matricule: String,
    dateArrivee: String,
    datePartir: String,
    place: Number,
  });

  const User = mongoose.model('smartparkingusers', userSchema);

  function readDataFromFile() {
    const rl = readline.createInterface({
      input: fs.createReadStream('./CarsIn.txt'),
      crlfDelay: Infinity,
    });

    let placeCounter = 1;

    rl.on('line', line => {
      const values = line.split(',');

      const matricule = values[0].trim();
      const dateArrivee = values[1].trim();

      User.find({}).sort('place').exec()
        .then(smartparkingusers => {
          smartparkingusers.forEach(user => {
            if (user.place === placeCounter) {
              placeCounter++;
            }
          });

          User.findOne({ matricule: matricule }).exec()
            .then(existingUser => {
              if (existingUser) {
                console.log('Server running ...');

                if (existingUser.place === 0) {
                  User.updateOne({ matricule: matricule }, { dateArrivee: dateArrivee, datePartir: null, place: placeCounter })
                    .then(() => {
                      console.log(`User out detected: ${dateArrivee}, place: ${placeCounter}`);
                      placeCounter++;
                    })
                    .catch(err => {
                      console.error('Error updating user:', err);
                    });
                }
              } else {
                User.create({ matricule, dateArrivee, place: placeCounter, datePartir: null })
                  .then(() => {
                    console.log(`User added with place: ${placeCounter}`);
                    placeCounter++;
                  })
                  .catch(err => {
                    console.error('Error inserting data:', err);
                  });
              }
            })
            .catch(err => {
              console.error('Error finding user:', err);
            });
        })
        .catch(err => {
          console.error('Error finding users:', err);
        });
    });
  }

  setInterval(readDataFromFile, 1000);
});
