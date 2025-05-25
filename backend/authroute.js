require("dotenv").config();
const express = require("express");
const authRoutes = require("./auth/auth");

const app = express();
const PORT = process.env.PORT || 5001;

// Route prefix: /auth
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
