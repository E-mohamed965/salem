const mongoose=require('mongoose');
const roomSchema=mongoose.Schema({
    name:{
        type:String,
        reequired:true,
    },
    description:{
      type:String,
      required:true
    } ,
    image:{
        type:String
        ,default:''
    },
    capacity:{
        type:Number,
        default:2,
        required:true
    }
    ,
    images:[{
       type:String
    }],
    price:{
       type:Number,
       default:0
    },
    availability:{
        type:Boolean,
        default:true

    },
    rating:{
        type:Number,
        default:0
    },
    numReviews:{
        type:Number,
        default:0
    },
    dateAdded:{
        type:Date,
        default:Date.now
    }
})
roomSchema.virtual('id').get(function(){
    return this._id.toHexString();
})
roomSchema.set('toJSON',{
    virtuals:true
})
exports.Room =mongoose.model('Room',roomSchema);

