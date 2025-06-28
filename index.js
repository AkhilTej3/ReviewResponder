const express = require("express");
const gplay = require("google-play-scraper");
const appstore = require("app-store-scraper");

const app = express();
const PORT = process.env.PORT || 80;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//CORS middleware to allow requests from any origin
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.get("/reviews", async (req, res) => {
  try {
    const googlePlayAppId = req.query.googleAppId; // e.g. com.whatsapp
    const appStoreAppId = req.query.iosAppId; // e.g. 310633997 (numeric)

    if (!googlePlayAppId && !appStoreAppId) {
      return res
        .status(400)
        .json({ error: "At least one app ID is required." });
    }

    const results = {};

    if (googlePlayAppId) {
      const googleReviews = await gplay.reviews({
        appId: googlePlayAppId,
        sort: gplay.sort.NEWEST,
        num: 10,
        throttle: 10,
      });

      console.log(googleReviews?.data);

      results.googlePlay = googleReviews?.data?.map((review) => ({
        platform: "Google Play",
        id: review.id,
        userName: review.userName,
        rating: review.score,
        title: "",
        content: review.text,
        date: review.date,
        version: review.reviewCreatedVersion || null,
      }));
    }

    if (appStoreAppId) {
      const iosReviews = await appstore.reviews({
        id: appStoreAppId,
        sort: appstore.sort.RECENT,
        country: "in",
      });

      console.log(iosReviews);

      results.appStore = iosReviews.map((review) => ({
        platform: "App Store",
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        title: review.title,
        content: review.text,
        date: review.updated,
        version: review.version,
      }));
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Review fetch error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Review fetch service running on port ${PORT}`);
});
