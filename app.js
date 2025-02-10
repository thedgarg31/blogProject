const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require('lodash');
const slugify = require('slugify');  // ✅ Import slugify
const compression = require('compression');  // ✅ Import compression
const helmet = require('helmet');  // ✅ Import helmet

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices.";

const app = express();

// ✅ Enable security, compression & static caching for better performance
app.use(helmet());
app.use(compression());
app.use(express.static("public", { maxAge: '1y', etag: false }));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/blogDB", () => {
    console.log("Connected to MongoDB");
});

// ✅ Updated Schema with slug field
const contentSchema = new mongoose.Schema({
    title: String,
    detail: String,
    slug: { type: String, unique: true }
});

// ✅ Auto-generate slug before saving
contentSchema.pre('save', function (next) {
    this.slug = slugify(this.title, { lower: true, strict: true });
    next();
});

const Content = mongoose.model("Content", contentSchema);

const defaultContents = [
    new Content({
        title: "blog-1",
        detail: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    })
];

// ✅ Home Route
app.get("/", function (req, res) {
    Content.find({}, function (err, foundContents) {
        if (foundContents.length === 0) {
            Content.insertMany(defaultContents, function (err) {
                if (err) console.log(err);
                else console.log("Successfully saved in DB");
            });
            res.redirect("/");
        } else {
            res.render("home", { homeStarting: homeStartingContent, posts: foundContents });
        }
    });
});

// ✅ Updated SEO-friendly Post Route
app.get("/posts/:slug", function (req, res) {
    Content.findOne({ slug: req.params.slug }, function (err, foundContent) {
        if (!err && foundContent) {
            res.render("post", {
                title: foundContent.title,
                content: foundContent.detail,
                seoTitle: foundContent.title + " | My Blog",
                seoDescription: foundContent.detail.substring(0, 150),
                seoKeywords: foundContent.title.split(" ").join(", ") + ", blog, articles"
            });
        } else {
            res.status(404).send("Post not found");
        }
    });
});

// ✅ About Page
app.get("/about", function (req, res) {
    res.render("about", { about: aboutContent });
});

// ✅ Contact Page
app.get("/contact", function (req, res) {
    res.render("contact", { contact: contactContent });
});

// ✅ Compose Page
app.get("/compose", function (req, res) {
    res.render("compose");
});

// ✅ Updated Compose Route (Now Generates Slugs)
app.post("/compose", function (req, res) {
    const newPost = new Content({
        title: req.body.item,
        detail: req.body.postText,
        slug: slugify(req.body.item, { lower: true, strict: true }) // ✅ Generate slug
    });

    newPost.save(function (err) {
        if (!err) {
            console.log("Post saved successfully!");
            res.redirect("/");
        }
    });
});

// ✅ Server Listening on Port 3000
app.listen(3000, function () {
    console.log("Server started on port 3000");
});
