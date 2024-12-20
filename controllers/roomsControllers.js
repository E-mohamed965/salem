const express = require('express');
const app = express();
require('dotenv/config');
const multer = require('multer');
const Redis = require('ioredis');  


const redis = new Redis({
  host: 'localhost', 
  port: 6379,        
  db: 0,             
});

const { Room } = require('../models/rooms');

const addRoom = async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(404).json({ message: 'No image uploaded' });
  } else {
    const fileName = req.file.filename;
    const pasePath = `${req.protocol}://${req.get('host')}/public/upload/`;
    const room = new Room({
      image: `${pasePath}${fileName}`,
      ...req.body,
    });

    room
      .save()
      .then((room) => {
        redis.del('rooms');  
        res.status(200).json(room);
      })
      .catch((err) => {
        res.json({
          error: err,
        });
      });
  }
};

const getRooms = async (req, res) => {
  const cacheKey = 'rooms';  
  const cachedRooms = await redis.get(cacheKey);  

  if (cachedRooms) {
    
    console.log('Cache hit for rooms');
    return res.json(JSON.parse(cachedRooms));  
  } else {
    
    console.log('Cache miss for rooms. Querying DB...');
    let filter = {};
    if (req.query.capacity) {
      filter = { capacity: req.query.capacity };
    }

    const roomList = await Room.find(filter).lean();
    
    await redis.setex(cacheKey, 6000, JSON.stringify(roomList)); 
    console.log('Serving rooms from DB and caching result');
    res.send(roomList);
  }
};


const getOneRoom = async (req, res) => {
  const cacheKey = `room-${req.params.ID}`;  // Cache key for individual room
  const cachedRoom = await redis.get(cacheKey);  

  if (cachedRoom) {
    
    console.log('Cache hit for room');
    return res.status(200).json(JSON.parse(cachedRoom));  
  } else {
    
    console.log('Cache miss for room. Querying DB...');
    Room.findById(req.params.ID)
      .then((room) => {
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        
        redis.setex(cacheKey, 600, JSON.stringify(room));  
        console.log('Serving room from DB and caching result');
        res.status(200).send(room);
      })
      .catch((err) => {
        res.json({
          error: err,
        });
      });
  }
};

module.exports = {
  getRooms,
  addRoom,
  getOneRoom,
};
