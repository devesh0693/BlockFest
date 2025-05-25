const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const auth = admin.auth();
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await auth.createUser({ email, password });
    await auth.generateEmailVerificationLink(email);
    res.status(201).send({ message: "Verify your email before login." });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});
router.post("/login", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await auth.getUserByEmail(email);
    if (!user.emailVerified) {
      return res.status(403).send({ error: "Email not verified." });
    }
    res.status(200).send({ uid: user.uid });
  } catch (e) {
    
    res.status(400).send({ error: "User not found" });
  }
});

module.exports = router;