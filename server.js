import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/embed", upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "lrc", maxCount: 1 }
]), (req, res) => {
  const audio = req.files.audio[0];
  const lrc = req.files.lrc[0];
  const output = `output_${Date.now()}_${audio.originalname}`;

  const cmd = `
    ffmpeg -y -i "${audio.path}" \
    -metadata:s:t mimetype=text/plain \
    -i "${lrc.path}" \
    -map 0:a -map 1 \
    -c copy \
    "${output}"
  `;

  exec(cmd, (err) => {
    if (err) return res.status(500).send("FFmpeg error");

    res.download(output, audio.originalname, () => {
      fs.unlinkSync(audio.path);
      fs.unlinkSync(lrc.path);
      fs.unlinkSync(output);
    });
  });
});

app.listen(process.env.PORT || 3000);
