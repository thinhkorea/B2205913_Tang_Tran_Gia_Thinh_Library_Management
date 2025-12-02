import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import bookRoutes from "./routes/book.routes.js";
import publisherRoutes from "./routes/publisher.routes.js";
import authorRoutes from "./routes/author.routes.js";
import readerRoutes from "./routes/reader.routes.js";
import borrowRoutes from "./routes/borrow.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import authRoutes from "./routes/auth.routes.js";
import fineRoutes from "./routes/fine.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Serve static files từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/readers", readerRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/publishers", publisherRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/fines", fineRoutes);

app.get("/", (req, res) => {
  res.send("Hello from MEVN backend — Server đang hoạt động!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
