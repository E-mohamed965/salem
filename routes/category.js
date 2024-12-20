const {Category}=require('../models/category');
const express=require('express');
const Router=express.Router();


Router.get('/',async(req,res)=>{
    const categoryList=await Category.find();
    if(categoryList.length==0){
        res.status(500).json({success:false})
    }
    else
    res.send(categoryList);
})
Router.post('/',async (req,res)=>{
    let category=new Category({
        ...req.body 
    })
    category=await category.save();
    if(!category){
       res.status(404).send('the category cannot be added')
    }
    res.send(category)
})
Router.delete('/:ID',(req,res)=>{
    Category.findByIdAndDelete(req.params.ID).then(category=>{
        if(category)
        {
            return res.status(200).json({success:true,
                message:"deleted successfully"
            })
        }
        else {
            return res.status(404).json({
                success:false,
                message:"category not found"
            })
        }
    }).catch(err=>{
        return res.status(400).json({
            success:false
            ,error:err
        })
    })
})
Router.get('/:ID',async (req,res)=>{
   const category= await Category.findById(req.params.ID);
    res.send(category);
})
Router.put('/:ID',async (req,res)=>{
    const category= await Category.findByIdAndUpdate(req.params.ID,{...req.body},{new:true})
    if(!category){
        res.status(404).send('the category cannot be added')
     }
     res.send(category)
})
module.exports=Router;