"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const {
  MEDIA_VERSION,
  WORK_VIDEOS,
  configurePreviewVideo,
  mediaUrl,
  selectPreviewVideos,
  isModalBackdropClick
} = require(path.join(root, "main.js"));

assert.equal(WORK_VIDEOS.length, 28, "gallery should contain all 28 recordings");
assert.equal(new Set(WORK_VIDEOS.map((item) => item.src)).size, 28, "video sources should be unique");
assert.equal(new Set(WORK_VIDEOS.map((item) => item.poster)).size, 28, "posters should be unique");
assert.ok(WORK_VIDEOS.every((item) => item.title === ""), "untitled recordings should not invent titles");
assert.equal(MEDIA_VERSION, "2", "gallery media should use cache version 2");
assert.equal(mediaUrl("videos/work/5173.mp4"), "videos/work/5173.mp4?v=2", "rendered media URLs should be versioned");
assert.ok(WORK_VIDEOS.every((item) => !item.src.includes("?") && !item.poster.includes("?")), "gallery paths should remain raw for file checks");

for (const item of WORK_VIDEOS) {
  assert.ok(fs.existsSync(path.join(root, item.src)), `missing video: ${item.src}`);
  assert.ok(fs.existsSync(path.join(root, item.poster)), `missing poster: ${item.poster}`);
}

const previewVideo = {};
configurePreviewVideo(previewVideo);
assert.equal(previewVideo.muted, true, "preview videos should be muted");
assert.equal(previewVideo.defaultMuted, true, "preview videos should be muted by default");

const visible = [
  { id: "a", ratio: 0.2 },
  { id: "b", ratio: 0.9 },
  { id: "c", ratio: 0.7 },
  { id: "d", ratio: 0.8 }
];
assert.deepEqual(
  selectPreviewVideos(visible, 3).map((item) => item.id),
  ["b", "d", "c"],
  "only the three most-visible previews should play"
);
assert.deepEqual(selectPreviewVideos(visible, 0), [], "a zero limit should play nothing");

const modal = {};
assert.equal(isModalBackdropClick(modal, modal), true, "a click on the dialog backdrop should close it");
assert.equal(isModalBackdropClick({}, modal), false, "a click on the video or controls should not close it");

console.log("gallery contract: ok");
