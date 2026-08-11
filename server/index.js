// Importing necessary modules and packages
const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/Course");
const paymentRoutes = require("./routes/Payments");
const contactUsRoute = require("./routes/Contact");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

// Setting up port number
const PORT = process.env.PORT || 4000;

// Loading environment variables from .env file
dotenv.config();

// Connecting to database
database.connect();

// -------------------------------------------------------------------
// CORS — allow production Vercel domain + any *.vercel.app preview URL
// -------------------------------------------------------------------
const ALLOWED_ORIGINS = [
	process.env.FRONTEND_URL, // e.g. https://studynotion.vercel.app
];

const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (e.g. mobile apps, curl, Postman)
		if (!origin) return callback(null, true);

		// Allow any Vercel preview deployment
		const isVercelPreview = /\.vercel\.app$/.test(origin);

		// Allow explicitly listed production domains
		const isAllowed = ALLOWED_ORIGINS.includes(origin);

		if (isVercelPreview || isAllowed) {
			callback(null, true);
		} else {
			callback(new Error(`CORS: origin '${origin}' not allowed`));
		}
	},
	credentials: true,
};

// -------------------------------------------------------------------
// Rate limiters
// -------------------------------------------------------------------

// Auth / OTP routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: "Too many requests, please try again later." },
});

// Payment routes: 30 requests per 15 minutes per IP
const paymentLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: "Too many payment requests, please try again later." },
});

// -------------------------------------------------------------------
// Middlewares
// -------------------------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // Security headers
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);

// Connecting to cloudinary
cloudinaryConnect();

// Setting up routes (rate limiters applied to auth and payment)
app.use("/api/v1/auth", authLimiter, userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentLimiter, paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running ...",
	});
});

// Listening to the server
app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});

// End of code.
