import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";

const app = express();
const upload = multer({ dest: "/tmp" });

app.get("/", (req, res) => {
  res.send("LRC Embed Server running 🚀");
});

app.post("/embed", upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "lrc", maxCount: 1 }
]), (req, res) => {
  try {
    const audio = req.files.audio[0];
    const lrc = req.files.lrc[0];

    const output = `/tmp/${Date.now()}_${audio.originalname}`;

    const lyrics = fs.readFileSync(lrc.path, "utf8")
      .replace(/"/g, "'"); // cegah error 

    const cmd = `
      ffmpeg -y -i "${audio.path}" \
      -metadata:s:a:0 lyrics="${lyrics}" \
      -codec copy \
      "${output}"
    `;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("FFmpeg error:", stderr);
        return res.status(500).send("FFmpeg failed");
      }

      res.download(output, audio.originalname, () => {
        fs.unlinkSync(audio.path);
        fs.unlinkSync(lrc.path);
        fs.unlinkSync(output);
      });
    });

  } catch (e) {
    console.error("Server error:", e);
    res.status(500).send("Server error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
