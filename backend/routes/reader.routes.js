import express from "express";
import {
  getAllReaders,
  createReader,
  updateReader,
  deleteReader,
  getReaderById,
} from "../controllers/reader.controller.js";

const router = express.Router();

router.get("/", getAllReaders);
router.get("/:id", getReaderById);
router.post("/", createReader);
router.put("/:id", updateReader);
router.delete("/:id", deleteReader);

export default router;
