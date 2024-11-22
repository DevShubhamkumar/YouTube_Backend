import mongoose, { Schema } from "mongoose";

const subscriptionsSchema = new mongoose.Schema({

    subscriber:{
        type : Schema.Types.ObjectId, // one who is subscribing 
        ref:"User"
    },
    channel :{
        type :Schema.Types.ObjectId, // ONe to who subscriber is subscirbing
        ref: 'User'

    },
    
},
{
    timestamps:true

}
)

export const Subscriptions = mongoose.model("Subscriptions",subscriptionsSchema)