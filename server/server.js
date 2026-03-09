const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connecté"))
  .catch((err) => console.error("❌ Erreur de connexion:", err));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/centres", require("./routes/centresRoutes"));
app.use("/api/products", require("./routes/productsRoutes"));
app.use("/api/orders", require("./routes/ordersRoutes"));
app.use("/api/suppliers", require("./routes/suppliersRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));
app.use("/api/vehicule", require("./routes/vehiculeRoutes"));
app.use("/api/chauffeur", require("./routes/chauffeurRoutes"));
app.use("/api/maintenance", require("./routes/maintenanceRoutes"));
app.use("/api/carburant", require("./routes/carburantRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Serveur lancé sur le port ${PORT}`),
);
