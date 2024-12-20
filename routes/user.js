const express = require('express');
const { User } = require('../models/user');
const Router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');  


const redis = new Redis({
  host: 'localhost', 
  port: 6379,       
  db: 0,            
});


Router.get('/', async (req, res) => {
  const cacheKey = 'userList';  
  const cachedUsers = await redis.get(cacheKey);  

  if (cachedUsers) {
    
    console.log('Cache hit for user list');
    return res.json(JSON.parse(cachedUsers));  
  } else {
    
    console.log('Cache miss for user list. Querying DB...');
    const userList = await User.find().select('name email phone isAdmin').lean();
    if (!userList) {
      return res.status(505).json({ success: true });
    }
   
    await redis.setex(cacheKey, 600, JSON.stringify(userList));  
    console.log('Serving user list from DB and caching result');
    res.send(userList);
  }
});

Router.post('/', async (req, res) => {
  let user = new User({
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    ...req.body,
  });
  user = await user.save();
  if (!user) res.status(505).send('User cannot be created');


  redis.del('userList');  
  res.send(user);
});

Router.post('/register', async (req, res) => {
  let user = new User({
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    ...req.body,
  });
  user = await user.save();
  if (!user) res.status(505).send('User cannot be created');

  
  redis.del('userList');
  res.send(user);
});

Router.get('/:id', async (req, res) => {
  const cacheKey = `user-${req.params.id}`; 
  const cachedUser = await redis.get(cacheKey);  

  if (cachedUser) {
   
    console.log('Cache hit for user');
    return res.status(200).json(JSON.parse(cachedUser));  
  } else {
    
    console.log('Cache miss for user. Querying DB...');
    const user = await User.findById(req.params.id).select('name email phone isAdmin');
    if (!user) {
      return res.status(505).json({ success: false });
    }
    
    redis.setex(cacheKey, 600, JSON.stringify(user));  
    console.log('Serving user from DB and caching result');
    res.send(user);
  }
});


Router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send('User not found');
  } else {
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          id: user.id,
          isAdmin: user.isAdmin,
          isRegistered: true,
        },
        process.env.secret,
        {
          expiresIn: '1d',
        }
      );
      const decoded = jwt.decode(token);
      console.log(decoded);

      return res.status(200).send({
        user: user.email,
        token: token,
      });
    } else {
      return res.status(400).send('Password is wrong');
    }
  }
});

Router.get('/get/count', async (req, res) => {
  const cacheKey = 'userCount';  
  const cachedUserCount = await redis.get(cacheKey);  

  if (cachedUserCount) {
    
    console.log('Cache hit for user count');
    return res.json({ userCount: parseInt(cachedUserCount) });  
  } else {
    
    console.log('Cache miss for user count. Querying DB...');
    const userList = await User.find();
    const userCount = userList.length;
    if (!userCount) {
      return res.status(500).json({ success: false });
    }
    
    await redis.setex(cacheKey, 600, userCount); 
    console.log('Serving user count from DB and caching result');
    res.send({ userCount: userCount });
  }
});

Router.delete('/:ID', (req, res) => {
  User.findByIdAndDelete(req.params.ID)
    .then((user) => {
      if (user) {
        return res.status(200).json({
          success: true,
          message: 'Deleted successfully',
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        error: err,
      });
    });
});

module.exports = Router;
