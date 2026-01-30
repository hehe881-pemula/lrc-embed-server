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
    const audio = req.files.audio?.[0];
    const lrc = req.files.lrc?.[0];
    if (!audio || !lrc) {
      return res.status(400).send("Missing files");
    }

    const output = `/tmp/${Date.now()}_${audio.originalname}`;
    const lyricsPlain = fs.readFileSync(lrc.path, "utf8")
      .replace(/\[.*?\]/g, "")   
      .replace(/\r?\n/g, " ")    
      .slice(0, 3000);           

    const cmd = `
      ffmpeg -y -i "${audio.path}" \
      -metadata lyrics="${lyricsPlain.replace(/"/g, "'")}" \
      -codec copy \
      "${output}"
    `;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("FFmpeg error:", stderr);
        return res.download(audio.path, audio.originalname);
      }

      res.download(output, audio.originalname, () => {
        fs.unlinkSync(audio.path);
        fs.unlinkSync(lrc.path);
        fs.unlinkSync(output);
      });
    });

  } catch (e) {
    console.error("Server crash:", e);
    res.status(500).send("Server error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
