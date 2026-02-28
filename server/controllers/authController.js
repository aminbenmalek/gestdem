const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  const { nom, email, pass } = req.body;

  try {
    // Vérification de l'existence de l'utilisateur
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Cet utilisateur existe déjà." });
    }

    user = new User({ nom, email, password: pass });

    // Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(pass, salt);

    await user.save();

    // Création du Token JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret_key_provisoire",
      { expiresIn: "24h" },
    );

    res.json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erreur Serveur");
  }
};

exports.login = async (req, res) => {
  const { email, pass } = req.body;
  console.log("Tentative de connexion avec:", email, pass);
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Identifiants invalides." });
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    console.log("Comparaison des mots de passe:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: "Identifiants invalides." });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret_key_provisoire",
      { expiresIn: "24h" },
    );

    res.json({
      id: user.id,
      nom: user.nom,
      email: user.email,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Erreur Serveur");
  }
};
