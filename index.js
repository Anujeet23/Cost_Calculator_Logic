const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

mongoose
  .connect("YOUR_URL")
  .then(() => console.log("Connected to Mong0DB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

const localityDataSchema = new mongoose.Schema({
  id: String,
  label: String,
  stateId: String,
  distId: String,
  pincode: String,
  geoLocation: [
    {
      Latitude: String,
      Longitude: String,
    },
  ],
});

const LocalityData = mongoose.model("LocalityData", localityDataSchema);

app.get("/", async (reqq, res) => {
  res.send("Cost Calculator Logic");
});

function haversineDistance(coords1, coords2) {
  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

app.post("/costcalculator", async (req, res) => {
  const senderPincode = req.body.senderPin;
  const receiverPincode = req.body.receiverPin;
  const lengthOfPackage = req.body.length;
  const widthOfPackage = req.body.width;
  const heightOfPackage = req.body.height;

  const senderLocation = await LocalityData.findOne({ pincode: senderPincode });
  const receiverLocation = await LocalityData.findOne({
    pincode: receiverPincode,
  });

  if (!senderLocation || !receiverLocation) {
    return res.status(404).send("One or Both Pin Codes Not Gound ");
  }

  const senderCoords = [
    parseFloat(senderLocation.geoLocation[0].Latitude),
    parseFloat(senderLocation.geoLocation[0].Longitude),
  ];
  const receiverCoords = [
    parseFloat(receiverLocation.geoLocation[0].Latitude),
    parseFloat(receiverLocation.geoLocation[0].Longitude),
  ];

  const distance = haversineDistance(senderCoords, receiverCoords);

  const costPerKgPerKm = 10;

  const volumetricWeight =
    (lengthOfPackage * widthOfPackage * heightOfPackage) / 5000;

  const finalCost = distance * volumetricWeight * costPerKgPerKm;

  res.json({
    Distance: distance,
    TotalCost: finalCost,
  });
});

app.listen(3000);
