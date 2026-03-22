import { MongoClient } from "mongodb";
import fs from "fs";

const uri = "mongodb+srv://vietan:bachda042002@cluster0.mavru.mongodb.net/Cluster0";
const client = new MongoClient(uri);
// mongodb+srv://vietan:bachda042002@cluster0.mavru.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

// async function exportCollection() {
//   await client.connect();
//   const db = client.db("FindYourAlley");
//   const collection = db.collection("orders");

//   const data = await collection.find({}).toArray();
//   fs.writeFileSync("collection.json", JSON.stringify(data, null, 2));

//   await client.close();
//   console.log("Collection exported!");
// }

// exportCollection();

async function deleteSomeEvents(limit = 700) {
  try {
    await client.connect();
    const db = client.db("FindYourAlley");
    const collection = db.collection("orders");

    // Find the first 'limit' documents
    const docsToDelete = await collection.find().limit(limit).toArray();
    const ids = docsToDelete.map(doc => doc._id);

    // Delete them by _id
    const result = await collection.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${result.deletedCount} documents.`);
  } finally {
    await client.close();
  }
}

deleteSomeEvents(100);