import multer from 'multer'


const storage = multer.diskStorage({
    destination: function (req, file, cb) { // req is  data but file we get all files data  from multer or fileuplaod express && CB is callback

      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // we get more option here choosing file orinnal name is not good thing but still we can change it 
    }
  })
  
  export const upload = multer({ 
    storage,
})