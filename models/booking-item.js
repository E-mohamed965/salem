const mongoose=require('mongoose');

const bookingItemSchema=mongoose.Schema({
    numberOfdays:{
        type:Number,
        required:true
       },
       room:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Room'
       }
});

exports.BookingItem=mongoose.model('BookingItem',bookingItemSchema);