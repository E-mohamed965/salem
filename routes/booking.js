const express=require('express');
const {Booking}=require('../models/booking');
const Router=express.Router();
const {BookingItem}=require('../models/booking-item');
const { populate } = require('dotenv');

Router.get('/',async(req,res)=>{
    const bookingList=await Booking.find()
    .populate('user','name')
    .populate({path:'bookingItems',populate:'room'})
    .sort({'dateBooked':-1});
    if(!bookingList.length){
        res.status(404).send('no bookings');
    }
    else{
        res.status(200).send(bookingList)
    }
});

Router.post('/', async (req, res) => {
    try {
        // Resolve all promises for saving booking items
        const bookingItemsIds = await Promise.all(
            req.body.bookingItems.map(async (bookingItem) => {
                let newBookingItem = new BookingItem({
                    numberOfdays: bookingItem.numberOfdays,
                    room: bookingItem.room,
                });

                newBookingItem = await newBookingItem.save();
                return newBookingItem._id; // Return the saved item's _id
            })
        );
        const totalPrices = await Promise.all(bookingItemsIds.map(async (bookingItemId)=>{
            const bookingItem = await BookingItem.findById(bookingItemId).populate('room');
            const totalPrice = bookingItem.room.price * bookingItem.numberOfdays;
            return totalPrice
        }))
    
        const totalPrice = totalPrices.reduce((a,b) => a +b , 0);

        // Create a new booking with resolved bookingItemsIds
        let booking = new Booking({
            bookingItems: bookingItemsIds,
            shippingAddress1: req.body.shippingAddress1,
            shippingAddress2: req.body.shippingAddress2,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            status: req.body.status,
            totalPrice: totalPrice,
            user: req.body.user,
        });

        booking = await booking.save();

        if (!booking) {
            return res.status(404).send('The booking cannot be added');
        }

        res.status(201).send(booking); // Send the created booking
    } catch (err) {
        res.status(500).send({ message: 'An error occurred', error: err.message });
    }
});


Router.get('/:id',async(req,res)=>{
   const booking = await Booking.findOne({ user: req.params.id })
    .populate('user', 'name') .populate({path:'bookingItems',populate:'room'});
    if(!booking){
        res.status(404).send('no bookings');
    }
    else{
        res.status(200).send(booking)
    }
});


Router.put('/:ID',async (req,res)=>{
    const booking= await Booking.findByIdAndUpdate(req.params.ID,{status:req.body.status},{new:true})
    if(!booking){
        res.status(404).send('the booking cannot be added')
     }
     res.send(booking)
})
 
Router.delete('/:ID',(req,res)=>{
    Booking.findByIdAndDelete(req.params.ID).then(async booking=>{
        if(booking)
        {
            await booking.bookingItems.map(async bookingItem=>{
                await BookingItem.findByIdAndDelete(bookingItem)
            })
            return res.status(200).json({success:true,
                message:"deleted successfully"
            })
        }
        else {
            return res.status(404).json({
                success:false,
                message:"booking not found"
            })
        }
    }).catch(err=>{
        return res.status(400).json({
            success:false
            ,error:err
        })
    })
})

Router.get('/get/totalsales', async (req, res)=> {
    const totalSales= await Booking.aggregate([
        { $group: { _id: null , totalsales : { $sum : '$totalPrice'}}}
    ])

    if(!totalSales) {
        return res.status(400).send('The booking sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales})
});

Router.get('/get/count',async(req,res)=>{
    const bookingList =await Booking.find();
    const bookingCount=bookingList.length;
    if(!bookingCount){
        res.status(500).json({success:false});
    }
    else res.send({
        bookingCount:bookingCount
    })
});


Router.get('/get/userbookings:userId',async(req,res)=>{
    const bookingList= await Booking.find({user:req.params.userId})
    .populate('user','name')
    .populate({path:'bookingItems',populate:'room'})
    .sort({'dateBookinged':-1});
    if(!bookingList.length){
        res.status(404).send('no bookings');
    }
    else{
        res.status(200).send(bookingList)
    }
})



module.exports=Router