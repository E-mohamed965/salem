const mongoose=require('mongoose');

const bookingSchema=mongoose.Schema({
       bookingItems:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'BookingItem',
        required:true
       }],
       city:{
         type:String,
         required:true
       },
       phone:{
        type:String,
        required:true
       },
       totalPrice:{
        type:Number
       },
       user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',

       },
       dateOrdered:{
        type:Date,
        default:Date.now
       }
});

bookingSchema.virtual('id').get(function(){
    return this._id.toHexString();
});
 

bookingSchema.set('toJSON',{
    virtuals:true
})

exports.Booking=mongoose.model('Booking',bookingSchema);