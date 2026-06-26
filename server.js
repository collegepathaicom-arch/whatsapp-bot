const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// ✅ Webhook verification (Meta checks this when you connect Render)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Handle incoming messages
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object) {
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages && messages[0]) {
      const from = messages[0].from; // sender's WhatsApp number
      const msgBody = messages[0].text?.body;

      console.log("Received message:", msgBody);

      // Send a reply back
      await axios.post(
        `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: `You said: ${msgBody}` },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
